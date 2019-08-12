'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('inserting data into a table', () => {
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

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('with an array of columns', () => {
        it('inserts values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert(['name', 'age'])
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert(['name', 'age'])
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with multiple column arguments', () => {
        it('inserts values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert('name', 'age')
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert('name', 'age')
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    // TODO(Rui): remove support for this functionality since its not described by the EBNF.
    it('inserts values provided as a mapping object to each column', () => {
        const expected = [['foo', 23]];
        const actual = [];

        return table.insert({ name: 'foo', age: 23 })
            .execute()
            .then(() => table.select().execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('falsy values', () => {
        it('inserts `0` values', () => {
            const expected = [['foo', 0]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', 0)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts `false` values', () => {
            const expected = [['foo', 0]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', false)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts `null` values', () => {
            const expected = [['foo', null]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', null)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts `undefined` values', () => {
            const expected = [['foo', null]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', undefined)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30158425', () => {
        beforeEach('add BLOB column', () => {
            return session.sql('ALTER TABLE test ADD COLUMN (bin BLOB)')
                .execute();
        });

        it('saves a Node.js Buffer as a MySQL BLOB', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const data = new Buffer('foo');
            const expected = [[data]];
            const actual = [];

            return table.insert('bin')
                .values(data)
                .execute()
                .then(() => {
                    return table.select('bin').execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
