'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const tableUpdate = require('lib/DevAPI/TableUpdate');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('TableUpdate', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableUpdate().getClassName()).to.equal('TableUpdate');
        });
    });

    context('where()', () => {
        it('should set the query criteria', () => {
            const criteria = 'foo';

            expect(tableUpdate().where(criteria).getCriteria()).to.equal(criteria);
        });
    });

    context('execute()', () => {
        let crudModify;

        beforeEach('create fakes', () => {
            crudModify = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should fail if a condition query is not provided', () => {
            const query = tableUpdate();

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `update()` or `where()`');
        });

        it('should fail if a condition query is empty', () => {
            const query = tableUpdate(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `update()` or `where()`');
        });

        it('should fail if a condition query is not valid', () => {
            const query = tableUpdate(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `update()` or `where()`');
        });

        it('should fail if the query results in an error', () => {
            const query = tableUpdate({ _client: { crudModify } }, 'foo', 'bar', 'baz');
            const error = new Error('foobar');

            td.when(crudModify(query)).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should succeed if the query succeed with the state of the query', () => {
            const query = tableUpdate({ _client: { crudModify } }, 'foo', 'bar', 'baz');
            const state = { foo: 'bar' };
            const expected = new Result(state);

            td.when(crudModify(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });
});
