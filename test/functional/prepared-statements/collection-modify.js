'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const util = require('../../util');

describe('prepared statements for CollectionModify', () => {
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
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        return collection.modify('_id = :id')
            .bind('id', '1')
            .set('name', 'quux')
            .execute()
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');
        const sql = `UPDATE \`${schema.getName()}\`.\`test\` SET doc=JSON_SET(JSON_SET(doc,'$.name','quux'),'$._id',JSON_EXTRACT(\`doc\`,'$._id')) WHERE (JSON_EXTRACT(doc,'$._id') = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.bind('id', '3').unset('name').execute())
            .then(() => util.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

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

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2' }, { _id: '3' }, { _id: '4' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');
        const sql = `UPDATE \`${schema.getName()}\`.\`test\` SET doc=JSON_SET(JSON_REMOVE(JSON_SET(doc,'$.name','quux'),'$.name'),'$._id',JSON_EXTRACT(\`doc\`,'$._id')) WHERE (JSON_EXTRACT(doc,'$._id') = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.unset('name').execute())
            .then(() => op.bind('id', '3').execute())
            // at this point the operation still unsets the `name` property
            .then(() => op.bind('id', '4').execute())
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => util.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
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
            const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
            const actual = [];

            const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

            return op.execute()
                .then(() => op.bind('id', '2').execute())
                .then(() => util.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
