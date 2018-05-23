'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const tableDelete = require('lib/DevAPI/TableDelete');
const proxyquire = require('proxyquire');
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
            return expect(tableDelete().execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if a condition query is empty', () => {
            const query = tableDelete(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if a condition query is not valid', () => {
            const query = tableDelete(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if the operation results in an error', () => {
            const error = new Error('foobar');
            // criteria is required
            const query = tableDelete({ _client: { crudRemove } }).where('foo');

            td.when(crudRemove(query)).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeTableDelete = proxyquire('lib/DevAPI/TableDelete', { './Result': fakeResult });

            const query = fakeTableDelete({ _client: { crudRemove } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudRemove(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });
});
