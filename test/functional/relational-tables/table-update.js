'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const mysqlx = require('index');

describe('@functional relational table update', () => {
    let session, schema, table;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    beforeEach('create table', () => {
        return session.sql(`CREATE TABLE test (
                name VARCHAR(255),
                age INT)`)
            .execute();
    });

    beforeEach('load table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return table.insert(['name', 'age'])
            .values(['foo', 42])
            .values(['bar', 23])
            .values(['baz', 42])
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('should update all rows in a table using `where()`', () => {
        const expected = [['foo', 23], ['foo', 42], ['foo', 42]];
        let actual = [];

        return table.update()
            .set('name', 'foo')
            .where('true')
            .execute()
            .then(() => {
                return table.select()
                    .orderBy('age ASC')
                    .execute(row => actual.push(row));
            })
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should update the rows in a table that match the criteria defined with `where()`', () => {
        const expected = [['bar', 23], ['foo', 42], ['foo', 42]];
        let actual = [];

        return table.update()
            .where('age = 42')
            .set('name', 'foo')
            .execute()
            .then(() => {
                return table.select()
                    .orderBy('age ASC')
                    .execute(row => actual.push(row));
            })
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should update a given number of rows', () => {
        const expected = [['bar', 23], ['baz', 42], ['qux', 42]];
        let actual = [];

        return table.update('true')
            .set('name', 'qux')
            .limit(1)
            .orderBy('name DESC')
            .execute()
            .then(() => {
                return table.select()
                    .orderBy('name ASC')
                    .execute(row => actual.push(row));
            })
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('nullable values', () => {
        it('should update values with null', () => {
            const expected = [['bar', null], ['baz', null], ['foo', null]];
            let actual = [];

            return table.update('true')
                .set('age', null)
                .execute()
                .then(() => {
                    return table.select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update values with undefined', () => {
            const expected = [['bar', null], ['baz', null], ['foo', null]];
            let actual = [];

            return table.update('true')
                .set('age')
                .execute()
                .then(() => {
                    return table.select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        it('should update all documents that match a criteria specified by a grouped expression', () => {
            const expected = [['foo', 50], ['bar', 50], ['baz', 42]];
            let actual = [];

            return table.update()
                .where("name in ('foo', 'bar')")
                .set('age', 50)
                .execute()
                .then(() => {
                    return table.select()
                        .orderBy('age DESC', 'name DESC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [['baz', 42], ['foo', 42], ['qux', 23]];
            let actual = [];

            return table
                .update()
                .where('age not in (42, 50)')
                .set('name', 'qux')
                .execute()
                .then(() => {
                    return table.select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
