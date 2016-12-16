'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const BaseQuery = require('lib/DevAPI/BaseQuery');
const CollectionFind = require('lib/DevAPI/CollectionFind');
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const td = require('testdouble');

describe('DevAPI Collection Find', () => {
    context('constructor', () => {
        it('should be an instance of BaseQuery', () => {
            expect(new CollectionFind()).to.be.an.instanceof(BaseQuery);
        });
    });

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
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, { row_count: 10, offset: 0 });

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
