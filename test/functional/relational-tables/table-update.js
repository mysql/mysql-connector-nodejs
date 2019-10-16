'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('updating data in a table', () => {
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

    it('updates all rows in a table using `where()`', () => {
        const expected = [['foo', 23], ['foo', 42], ['foo', 42]];
        const actual = [];

        return table.update()
            .set('name', 'foo')
            .where('true')
            .execute()
            .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('updates the rows in a table that match the criteria defined with `where()`', () => {
        const expected = [['bar', 23], ['foo', 42], ['foo', 42]];
        const actual = [];

        return table.update()
            .where('age = 42')
            .set('name', 'foo')
            .execute()
            .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('fails to update any row if no filtering criteria is provided with `where()`', () => {
        return table.update()
            .where()
            .set('name', 'foo')
            .execute()
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
    });

    it('updates a given number of rows', () => {
        const expected = [['bar', 23], ['baz', 42], ['qux', 42]];
        const actual = [];

        return table.update()
            .where('true')
            .set('name', 'qux')
            .limit(1)
            .orderBy('name DESC')
            .execute()
            .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('nullable values', () => {
        it('updates values with null', () => {
            const expected = [['bar', null], ['baz', null], ['foo', null]];
            const actual = [];

            return table.update()
                .where('true')
                .set('age', null)
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('updates values with undefined', () => {
            const expected = [['bar', null], ['baz', null], ['foo', null]];
            const actual = [];

            return table.update()
                .where('true')
                .set('age')
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        it('updates all documents that match a criteria specified by a grouped expression', () => {
            const expected = [['foo', 50], ['bar', 50], ['baz', 42]];
            const actual = [];

            return table.update()
                .where("name in ('foo', 'bar')")
                .set('age', 50)
                .execute()
                .then(() => table.select().orderBy('age DESC', 'name DESC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('updates all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [['baz', 42], ['foo', 42], ['qux', 23]];
            const actual = [];

            return table.update()
                .where('age not in (42, 50)')
                .set('name', 'qux')
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30163003', () => {
        beforeEach('add BLOB column', () => {
            return session.sql('ALTER TABLE test ADD COLUMN (bin BLOB)')
                .execute();
        });

        it('updates a MySQL BLOB using a Node.js Buffer', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const data = new Buffer('quux');
            const expected = [[data]];
            const actual = [];

            return table.update()
                .where('name = :name')
                .bind('name', 'foo')
                .set('bin', data)
                .execute()
                .then(() => {
                    return table.select('bin')
                        .where('name = :name')
                        .bind('name', 'foo')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30401962 affected items', () => {
        context('without limit', () => {
            it('returns the number of documents that have been updated in the table', () => {
                return table.update()
                    .where('true')
                    .set('name', 'quux')
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('with limit', () => {
            it('returns the number of documents that have been updated in the table', () => {
                const limit = 2;

                return table.update()
                    .where('true')
                    .set('name', 'quux')
                    .limit(limit)
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
            });
        });
    });
});
