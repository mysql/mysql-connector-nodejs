'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const util = require('../../util');

describe('prepared statements for TableUpdate', () => {
    let schema, session, table;

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
        return session.sql('CREATE TABLE test (_id VARBINARY(32), name VARCHAR(4))')
            .execute();
    });

    beforeEach('get table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return table.insert('_id', 'name')
            .values('1', 'foo')
            .values('2', 'bar')
            .values('3', 'baz')
            .values('4', 'qux')
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not create a prepared statement when the operation is executed once', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const expected = [[new Buffer('2'), 'bar'], [new Buffer('3'), 'baz'], [new Buffer('4'), 'qux']];
        const actual = [];

        return table.delete().where('_id = :id')
            .bind('id', '1')
            .execute()
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => table.select().orderBy('_id').execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const expected = [[new Buffer('3'), 'baz'], [new Buffer('4'), 'qux']];
        const actual = [];

        const op = table.delete().where('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (\`_id\` = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => table.select().orderBy('_id').execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const expected = [[new Buffer('4'), 'qux']];
        const actual = [];

        const op = table.delete().where('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.bind('id', '3').orderBy('name').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => table.select().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const expected = [[new Buffer('3'), 'baz'], [new Buffer('4'), 'qux']];
        const actual = [];

        const op = table.delete().where('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; schema = s.getSchema(schema.getName()); table = schema.getTable('test'); })
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => table.select().orderBy('_id').execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const actual = [];

        const op = table.delete().where('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (\`_id\` = ?) ORDER BY \`name\``;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.orderBy('name').execute())
            .then(() => op.bind('id', '3').execute())
            // at this point the operation still sorts the records by `name` before removing them
            .then(() => op.bind('id', '4').execute())
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => util.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => table.select().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.be.empty);
    });

    context('when the total server statement count is exceeded', () => {
        beforeEach('prevent additional prepared statements', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=0')
                .execute();
        });

        afterEach('reset default prepared statement limit', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=16382')
                .execute();
        });

        it('neither fails nor prepares any statement', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const expected = [[new Buffer('3'), 'baz'], [new Buffer('4'), 'qux']];
            const actual = [];

            const op = table.delete().where('_id = :id').bind('id', '1');

            return op.execute()
                .then(() => op.bind('id', '2').execute())
                .then(() => util.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => table.select().orderBy('_id').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
