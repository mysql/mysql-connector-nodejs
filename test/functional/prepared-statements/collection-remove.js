'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const util = require('../../util');

describe('prepared statements for CollectionRemove', () => {
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
        const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        return collection.remove('_id = :id')
            .bind('id', '1')
            .execute()
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$._id') = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.bind('id', '3').sort('name').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; schema = s.getSchema(schema.getName()); collection = schema.getCollection('test'); })
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not re-prepare a statement if the limit changes', () => {
        const expected = [{ _id: '1', name: 'foo' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('name LIKE :name').bind('name', '%ba%');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_UNQUOTE(JSON_EXTRACT(doc,'$.name')) LIKE ?) LIMIT ?`;

        return op.execute()
            .then(() => op.limit(1).execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.limit(2).execute())
            .then(() => util.getPreparedStatement(session, 1))
            // statement id in the server should be the same
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$._id') = ?) ORDER BY JSON_EXTRACT(doc,'$.name')`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.sort('name').execute())
            .then(() => op.bind('id', '3').execute())
            // at this point the operation still sorts the records before removing them
            .then(() => op.bind('id', '4').execute())
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => util.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
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
            const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
            const actual = [];

            const op = collection.remove('_id = :id').bind('id', '1');

            return op.execute()
                .then(() => op.bind('id', '2').execute())
                .then(() => util.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
