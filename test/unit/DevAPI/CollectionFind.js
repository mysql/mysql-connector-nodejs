'use strict';

/* eslint-env node, mocha */
/* global Server, Messages, Client, chai, mysqlxtest */

const CollectionFind = require('lib/DevAPI/CollectionFind');
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const td = require('testdouble');

function produceResultSet (protocol, rowCount) {
    const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));
    result.beginResult([{
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
        name: '_doc',
        original_name: '_doc',
        table: 'table',
        original_table: 'original_table',
        schema: 'schema',
        content_type: 2 /* JSON */
    }, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: '_doc',
        original_name: '_doc',
        table: 'table',
        original_table: 'original_table',
        schema: 'schema'
    }]);

    const fields = ['{"foo":"bar"}\0', '\x02'];
    for (let r = 0; r < rowCount; ++r) {
        result.row(fields);
    }
    result.finalize();
}

describe('DevAPI Collection Find', () => {
    let session, collection, spy, origFind;

    beforeEach('get Session', function () {
        return mysqlxtest.getNullSession().then(function (s) {
            session = s;
            collection = session.getSchema('schema').getCollection('collection');
        });
    });

    beforeEach('create spy', function () {
        spy = chai.spy(Client.prototype.crudFind);
        origFind = Client.prototype.crudFind;
        Client.prototype.crudFind = spy;
    });

    afterEach('reset spy', () => {
        if (origFind) {
            Client.prototype.crudFind = origFind;
        }
    });

    it('should not allow to set a negative limit', () => {
        (() => collection.find().limit(-10).execute()).should.throw(/Limit can't be negative/);
    });

    it('should not allow to set an negative offset', () => {
        (() => collection.find().limit(10, -10).execute()).should.throw(/Offset can't be negative/);
    });

    it('should resolve with zero rows', () => {
        const rowcb = chai.spy();
        const promise = collection.find().execute(rowcb);

        produceResultSet(session._client, 0);
        rowcb.should.not.be.called;

        return promise.should.be.fullfilled;
    });

    it('should return only the first column', () => {
        const rowcb = chai.spy();
        const promise = collection.find().execute(rowcb);

        produceResultSet(session._client, 1);
        rowcb.should.be.called.once.with({foo: 'bar'});

        return promise.should.be.fullfilled;
    });

    it('should return multiple rows', () => {
        const rowcb = chai.spy();
        const promise = collection.find().execute(rowcb);

        produceResultSet(session._client, 10);
        rowcb.should.be.called.exactly(10).with({foo: 'bar'});

        return promise.should.be.fullfilled;
    });

    it('should send the data over the wire ;-)');

    context('bind()', () => {
        it('should be fluent', () => {
            const query = (new CollectionFind()).bind('foo', 'bar');

            expect(query).to.be.an.instanceof(CollectionFind);
        });

        it('should do nothing if no argument is provided', () => {
            const query = new CollectionFind();
            const bounds = Object.assign({}, query._bounds);

            query.bind();

            expect(query._bounds).to.deep.equal(bounds);
        });

        it('should add a mapping entry to a map', () => {
            const expected = { foo: 'bar' };
            const query = (new CollectionFind()).bind({ foo: 'bar' });

            expect(query._bounds).to.deep.equal(expected);
        });

        it('should add a named parameter to a map', () => {
            const expected = { foo: 'bar' };
            const query = (new CollectionFind()).bind('foo', 'bar');

            expect(query._bounds).to.deep.equal(expected);
        });

        it('should add multiple named parameters to a map', () => {
            const expected = {
                foo: 'bar',
                baz: 'qux'
            };
            const query = (new CollectionFind())
                .bind('foo', 'bar')
                .bind('baz', 'qux');

            expect(query._bounds).to.deep.equal(expected);
        });

        it('should replace any previously set binding', () => {
            const expected = { foo: 'baz' };
            const query = (new CollectionFind())
                .bind('foo', 'bar')
                .bind('foo', 'baz');

            expect(query._bounds).to.deep.equal(expected);
        });

        it('should mix and match both type of parameters', () => {
            const expected = {
                'foo': 'bar',
                'bar': 'baz'
            };
            const query = (new CollectionFind())
                .bind('foo', 'bar')
                .bind({ bar: 'baz' });

            expect(query._bounds).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        let fakeSession, fakeSchema;

        beforeEach('create fakes', () => {
            const crudFind = td.function();
            const getName = td.function();

            fakeSession = { _client: { crudFind } };
            fakeSchema = { getName };
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should include the criteria', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new CollectionFind(fakeSession, fakeSchema, null, '1 == 1'));
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, '1 == 1');

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            query.execute().should.eventually.equal(expected);
        });

        it('should include the limit count and offset', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new CollectionFind(fakeSession, fakeSchema)).limit(10, 0);
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, { count: 10, offset: 0 });

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            query.execute().should.eventually.equal(expected);
        });

        it('should include the bounds', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new CollectionFind(fakeSession, fakeSchema)).bind('foo', 'bar');
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, { foo: 'bar' });

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            query.execute().should.eventually.equal(expected);
        });
    });
});
