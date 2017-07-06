'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionFind = require('lib/DevAPI/CollectionFind');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('DevAPI CollectionFind', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(collectionFind().getClassName()).to.equal('CollectionFind');
        });
    });

    context('bind()', () => {
        it('should be fluent', () => {
            const query = (collectionFind()).bind('foo', 'bar');

            expect(query.bind).to.be.a('function');
        });

        it('should do nothing if no argument is provided', () => {
            const query = collectionFind();
            const mapping = Object.assign({}, query.getBindings());

            query.bind();

            expect(query.getBindings()).to.deep.equal(mapping);
        });

        it('should add a mapping entry to a map', () => {
            const expected = { foo: 'bar' };
            const query = (collectionFind()).bind({ foo: 'bar' });

            expect(query.getBindings()).to.deep.equal(expected);
        });

        it('should add a named parameter to a map', () => {
            const expected = { foo: 'bar' };
            const query = (collectionFind()).bind('foo', 'bar');

            expect(query.getBindings()).to.deep.equal(expected);
        });

        it('should add multiple named parameters to a map', () => {
            const expected = {
                foo: 'bar',
                baz: 'qux'
            };
            const query = (collectionFind())
                .bind('foo', 'bar')
                .bind('baz', 'qux');

            expect(query.getBindings()).to.deep.equal(expected);
        });

        it('should replace any previously set binding', () => {
            const expected = { foo: 'baz' };
            const query = (collectionFind())
                .bind('foo', 'bar')
                .bind('foo', 'baz');

            expect(query.getBindings()).to.deep.equal(expected);
        });

        it('should mix and match both type of parameters', () => {
            const expected = {
                'foo': 'bar',
                'bar': 'baz'
            };
            const query = (collectionFind())
                .bind('foo', 'bar')
                .bind({ bar: 'baz' });

            expect(query.getBindings()).to.deep.equal(expected);
        });
    });

    context('lockShared()', () => {
        it('should set the correct locking mode', () => {
            const query = (collectionFind()).lockShared();

            expect(query.getLockingMode()).to.equal(1);
        });
    });

    context('lockExclusive()', () => {
        it('should set the correct locking mode', () => {
            const query = (collectionFind()).lockExclusive();

            expect(query.getLockingMode()).to.equal(2);
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
            const query = collectionFind(fakeSession, fakeSchema, null, '1 == 1');
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, '1 == 1');

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should include the limit count and offset', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind(fakeSession, fakeSchema).limit(10, 0);
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, { row_count: 10, offset: 0 });

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should include the value mapping', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind(fakeSession, fakeSchema).bind('foo', 'bar');
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, { foo: 'bar' });

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).eventually.deep.equal(expected);
        });

        it('should set the correct default locking mode', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind(fakeSession, fakeSchema);
            // default locking mode
            const mode = 0;
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, any, any, mode);

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).eventually.deep.equal(expected);
        });

        it('should include the latest specified locking mode', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind(fakeSession, fakeSchema).lockShared().lockExclusive();
            const mode = 2;
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, any, any, mode);

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).eventually.deep.equal(expected);
        });
    });
});
