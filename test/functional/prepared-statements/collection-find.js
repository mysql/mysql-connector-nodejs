'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const util = require('../..//util');

describe('prepared statements for CollectionFind', () => {
    let collection, schema, session;

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

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .add({ _id: '3', name: 'baz' })
            .add({ _id: '4', name: 'qux' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not create a prepared statement when the operation is executed once', () => {
        const expected = [{ _id: '1', name: 'foo' }];
        const actual = [];

        return collection.find('name = :name')
            .bind('name', 'foo')
            .execute(doc => actual.push(doc))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not create a prepared statement when the operation is re-created after the first execution', () => {
        const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '1', name: 'foo' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.find();

        return op.execute()
            .then(() => op.sort('name').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => op.sort('name').execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '2', name: 'bar' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');
        const sql = `SELECT doc FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$.name') = ?)`;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '3' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.bind('name', 'baz').fields('_id').execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const op = collection.find('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; })
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist);
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const expected = [{ _id: '4' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');
        const sql = `SELECT JSON_OBJECT('_id', JSON_EXTRACT(doc,'$._id')) AS doc FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$.name') = ?)`;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.fields('_id').execute())
            .then(() => op.bind('name', 'baz').execute())
            // at this point the operation still projects the `_id` property only
            .then(() => op.bind('name', 'qux').execute(doc => actual.push(doc)))
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => util.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-reprepares a statement using an implicit offset placeholder if a limit is introduced', () => {
        const expected = [{ _id: '1', name: 'foo' }];
        const actual = [];

        const op = collection.find();
        const sql = 'SELECT doc FROM `nodejsmysqlxtest`.`test` LIMIT ?, ?';

        return op.execute()
            .then(() => op.execute())
            .then(() => op.limit(1).execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            // statement id in the server should be incremented since the previous statement was deallocated
            // sql statement should include placeholders for both LIMIT and OFFSET
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not deallocate a statement when the offset is introduced later', () => {
        const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
        const actual = [];

        const op = collection.find();
        const sql = 'SELECT doc FROM `nodejsmysqlxtest`.`test` LIMIT ?, ?';

        return op.execute()
            .then(() => op.limit(1).execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.offset(1).execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            // statement id in the server should remain the same since the statement was not deallocated
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not deallocate a statement when the limit and offset are changed', () => {
        const expected = [{ _id: '2', name: 'bar' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.find();
        const sql = 'SELECT doc FROM `nodejsmysqlxtest`.`test` LIMIT ?, ?';

        return op.execute()
            .then(() => op.limit(1).offset(1).execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.limit(2).offset(3).execute(doc => actual.push(doc)))
            .then(() => util.getPreparedStatement(session, 1))
            // statement id in the server should remain the same since the statement was not deallocated
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
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
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            const actual = [];

            const op = collection.find('name = :name').bind('name', 'foo');

            return op.execute(doc => actual.push(doc))
                .then(() => op.bind('name', 'bar').execute(doc => actual.push(doc)))
                .then(() => util.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
