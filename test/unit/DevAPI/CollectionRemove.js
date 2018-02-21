'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionRemove = require('lib/DevAPI/CollectionRemove');
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
            const operation = collectionRemove();

            return expect(operation.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if a condition query is empty', () => {
            const operation = collectionRemove(null, null, null, '');

            return expect(operation.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if the condition is not valid', () => {
            const operation = collectionRemove(null, null, null, ' ');

            return expect(operation.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('should fail if the operation results in an error', () => {
            const error = new Error('foobar');
            const operation = collectionRemove({ _client: { crudRemove } }, 'foo', 'bar', 'baz');

            td.when(crudRemove(operation)).thenReject(error);

            return expect(operation.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should succeed if the operation succeed with the state of the operation', () => {
            const operation = collectionRemove({ _client: { crudRemove } }, 'foo', 'bar', 'baz');
            const state = { ok: true };
            const expected = new Result(state);

            td.when(crudRemove(operation)).thenResolve(state);

            return expect(operation.execute()).to.eventually.deep.equal(expected);
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
