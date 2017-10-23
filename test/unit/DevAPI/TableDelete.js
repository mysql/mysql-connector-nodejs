'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const tableDelete = require('lib/DevAPI/TableDelete');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('TableDelete', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableDelete().getClassName()).to.equal('TableDelete');
        });
    });

    context('where()', () => {
        it('should set the operation criteria', () => {
            expect(tableDelete().where('foo').getCriteria()).to.equal('foo');
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

        it('should fail if a condition query is not provided', () => {
            return expect(tableDelete().execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `delete()` or `where()`');
        });

        it('should fail if a condition query is empty', () => {
            const operation = tableDelete(null, null, null, '');

            return expect(operation.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `delete()` or `where()`');
        });

        it('should fail if a condition query is not valid', () => {
            const operation = tableDelete(null, null, null, ' ');

            return expect(operation.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `delete()` or `where()`');
        });

        it('should fail if the operation results in an error', () => {
            const error = new Error('foobar');
            // criteria is required
            const operation = tableDelete({ _client: { crudRemove } }).where('foo');

            td.when(crudRemove(operation)).thenReject(error);

            return expect(operation.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should succeed if the operation succeed with the state of the operation', () => {
            // criteria is required
            const operation = tableDelete({ _client: { crudRemove } }).where('foo');
            const state = { ok: true };
            const expected = new Result(state);

            td.when(crudRemove(operation)).thenResolve(state);

            return expect(operation.execute()).to.eventually.deep.equal(expected);
        });
    });
});
