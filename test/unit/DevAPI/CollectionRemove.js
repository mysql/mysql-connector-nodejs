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
});
