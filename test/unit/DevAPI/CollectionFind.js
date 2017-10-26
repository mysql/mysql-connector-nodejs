'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionFind = require('lib/DevAPI/CollectionFind');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('DevAPI CollectionFind', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(collectionFind().getClassName()).to.equal('CollectionFind');
        });
    });

    context('lockShared()', () => {
        it('should include the method', () => {
            expect(collectionFind().lockShared).to.be.a('function');
        });
    });

    context('lockExclusive()', () => {
        it('should include the method', () => {
            expect(collectionFind().lockExclusive).to.be.a('function');
        });
    });

    context('fields()', () => {
        let collectionFind, parseFlexibleParamList, projecting, setProjections;

        beforeEach('create fakes', () => {
            parseFlexibleParamList = td.function();
            projecting = td.function();
            setProjections = td.function();

            collectionFind = proxyquire('lib/DevAPI/CollectionFind', {
                './Util/parseFlexibleParamList': parseFlexibleParamList,
                './Projecting': projecting
            });
        });

        it('should set projections provided as an array', () => {
            td.when(projecting()).thenReturn({ setProjections });
            td.when(parseFlexibleParamList([['foo', 'bar']])).thenReturn(['baz', 'qux']);

            collectionFind().fields(['foo', 'bar']);

            expect(td.explain(setProjections).callCount).to.equal(1);
            expect(td.explain(setProjections).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
        });

        it('should set projections provided as multiple arguments', () => {
            td.when(projecting()).thenReturn({ setProjections });
            td.when(parseFlexibleParamList(['foo', 'bar'])).thenReturn(['baz', 'qux']);

            collectionFind().fields('foo', 'bar');

            expect(td.explain(setProjections).callCount).to.equal(1);
            expect(td.explain(setProjections).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
        });
    });

    context('execute()', () => {
        let crudFind;

        beforeEach('create fakes', () => {
            crudFind = td.function();
        });

        it('should pass itself to the client implementation', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind({ _client: { crudFind } });

            td.when(crudFind(query, undefined)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should use a custom cursor to handle result set data', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = collectionFind({ _client: { crudFind } });
            const sideEffects = [];

            td.when(crudFind(query, td.callback(['foo']))).thenResolve(state);

            const callback = (value) => sideEffects.push(value);

            return expect(query.execute(callback)).to.eventually.deep.equal(expected).then(() => {
                return expect(sideEffects).to.deep.equal(['foo']);
            });
        });

        it('should fail if an unexpected error occurs', () => {
            const error = new Error('foobar');
            const query = collectionFind({ _client: { crudFind } });

            td.when(crudFind(query), { ignoreExtraArgs: true }).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });
    });
});
