'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
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

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if a condition query is empty', () => {
            const query = tableUpdate(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if a condition query is not valid', () => {
            const query = tableUpdate(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('should fail if the query results in an error', () => {
            const query = tableUpdate({ _client: { crudModify } }, 'foo', 'bar', 'baz');
            const error = new Error('foobar');

            td.when(crudModify(query)).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeTableUpdate = proxyquire('lib/DevAPI/TableUpdate', { './Result': fakeResult });

            const query = fakeTableUpdate({ _client: { crudModify } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudModify(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });
});
