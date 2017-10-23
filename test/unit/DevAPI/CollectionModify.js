'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionModify = require('lib/DevAPI/CollectionModify');
const td = require('testdouble');

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

        it('should succeed if the query succeed with the state of the query', () => {
            const query = collectionModify({ _client: { crudModify } }, 'foo', 'bar', 'baz');
            const state = { foo: 'bar' };
            const expected = new Result(state);

            td.when(crudModify(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });
});
