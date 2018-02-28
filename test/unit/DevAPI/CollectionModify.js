'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionModify = require('lib/DevAPI/CollectionModify');
const proxyquire = require('proxyquire');
const td = require('testdouble');
const updating = require('lib/DevAPI/Updating');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionModify', () => {
    let crudModify;

    beforeEach('create fakes', () => {
        crudModify = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(collectionModify().getClassName()).to.equal('CollectionModify');
        });
    });

    context('execute()', () => {
        it('should fail if a condition query is not provided', () => {
            const query = collectionModify();

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `modify()`');
        });

        it('should fail if a condition query is empty', () => {
            const query = collectionModify(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `modify()`');
        });

        it('should fail if the condition is not valid', () => {
            const query = collectionModify(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `modify()`');
        });

        it('should fail if the query results in an error', () => {
            const query = collectionModify({ _client: { crudModify } }, 'foo', 'bar', 'baz');
            const error = new Error('foobar');

            td.when(crudModify(query)).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeCollectionModify = proxyquire('lib/DevAPI/CollectionModify', { './Result': fakeResult });

            const query = fakeCollectionModify({ _client: { crudModify } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudModify(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });

    context('patch()', () => {
        it('should update the operation list with the correct operation', () => {
            const doc = { foo: 'bar', baz: { 'qux': 'quux' } };
            const expected = [{ source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];

            expect(collectionModify().patch(doc).getOperations()).to.deep.equal(expected);
        });

        it('should not delete any previously added operation', () => {
            const existing = [{ foo: 'bar' }];
            const doc = { baz: 'qux' };
            const expected = [{ foo: 'bar' }, { source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];
            const query = collectionModify();

            expect(query.setOperations(existing).patch(doc).getOperations()).to.deep.equal(expected);
        });
    });

    context('sort()', () => {
        it('should mix-in CollectionOrdering', () => {
            expect(collectionModify().sort).to.be.a('function');
        });

        it('should be fluent', () => {
            const query = collectionModify().sort();

            expect(query.sort).to.be.a('function');
        });

        it('should set the order parameters provided as an array', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = collectionModify().sort(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('should set the order parameters provided as multiple arguments', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = collectionModify().sort(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });
});
