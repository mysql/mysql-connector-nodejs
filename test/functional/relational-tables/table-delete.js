'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const mysqlx = require('index');

describe('@functional relational table delete', () => {
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
            age INT)`).execute();
    });

    beforeEach('load table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return schema
            .getTable('test')
            .insert(['name', 'age'])
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

    context('with truthy condition', () => {
        it('should remove all rows from a table without using `where()`', () => {
            let actual = [];

            return table
                .delete('true')
                .execute()
                .then(() => table.select().execute(row => row && row.length && actual.push(row)))
                .then(() => expect(actual).to.be.empty);
        });

        it('should remove all rows from a table using `where()`', () => {
            let actual = [];

            return table
                .delete()
                .where('true')
                .execute()
                .then(() => table.select().execute(row => row && row.length && actual.push(row)))
                .then(() => expect(actual).to.be.empty);
        });
    });

    context('with filtering condition', () => {
        it('should remove the rows from a table that match the criteria defined without `where()`', () => {
            const expected = [['bar', 23], ['baz', 42]];
            let actual = [];

            return table
                .delete('name = "foo"')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove the rows from a table that match the criteria defined with `where()`', () => {
            const expected = [['bar', 23]];
            let actual = [];

            return table
                .delete()
                .where('age = 42')
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove the rows from a table that match a bindable criteria without `where()`', () => {
            const expected = [['bar', 23], ['baz', 42]];
            let actual = [];

            return table
                .delete('name = :name AND age = :age')
                .bind('age', 42)
                .bind('name', 'foo')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove the rows from a table that match a bindable criteria with `where()`', () => {
            const expected = [['bar', 23]];
            let actual = [];

            return table
                .delete()
                .where('name = :name')
                .where('age = :age')
                // name will be ignored, since the criteria is replaced
                .bind({ name: 'foo', age: 42 })
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        it('should delete a given number of rows', () => {
            const expected = [['foo', 42]];
            let actual = [];

            return table
                .delete('true')
                .limit(2)
                .orderBy('name')
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        it('should return all documents that match a criteria specified by a grouped expression', () => {
            const expected = [];
            let actual = [];

            return table
                .delete()
                .where("name in ('foo', 'bar', 'baz')")
                .execute()
                .then(() => {
                    return table
                        .select()
                        .execute(row => row && row.length && actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [['bar', 23], ['baz', 42], ['foo', 42]];
            let actual = [];

            return table
                .delete()
                .where('age not in (23, 42)')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name')
                        .execute(row => row && row.length && actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
