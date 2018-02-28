'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionRemove = require('lib/DevAPI/CollectionRemove');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionRemove', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(collectionRemove().getClassName()).to.equal('CollectionRemove');
        });
    });

    context('execute()', () => {
        let crudRemove;

        beforeEach('create fakes', () => {
            crudRemove = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should fail if a criteria is not provided', () => {
            const query = collectionRemove();

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if a condition query is empty', () => {
            const query = collectionRemove(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if the condition is not valid', () => {
            const query = collectionRemove(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if the operation results in an error', () => {
            const error = new Error('foobar');
            const query = collectionRemove({ _client: { crudRemove } }, 'foo', 'bar', 'baz');

            td.when(crudRemove(query)).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeCollectionRemove = proxyquire('lib/DevAPI/CollectionRemove', { './Result': fakeResult });

            const query = fakeCollectionRemove({ _client: { crudRemove } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudRemove(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });

    context('sort()', () => {
        it('should mix-in CollectionOrdering', () => {
            expect(collectionRemove().sort).to.be.a('function');
        });

        it('should be fluent', () => {
            const query = collectionRemove().sort();

            expect(query.sort).to.be.a('function');
        });

        it('should set the order parameters provided as an array', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = collectionRemove().sort(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('should set the order parameters provided as multiple arguments', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = collectionRemove().sort(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });
});
