'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Client = require('lib/Protocol/Client');
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionModify = require('lib/DevAPI/CollectionModify');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionModify', () => {
    let crudModify, getName;
    let type = Client.dataModel.DOCUMENT;

    beforeEach('create fakes', () => {
        crudModify = td.function();
        getName = td.function();
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
            const operation = collectionModify();

            return expect(operation.execute()).to.eventually.be.rejectedWith('remove needs a valid condition');
        });

        it('should fail if a condition query is empty', () => {
            const operation = collectionModify(null, null, null, '');

            return expect(operation.execute()).to.eventually.be.rejectedWith('remove needs a valid condition');
        });

        it('should fail if the condition is not valid', () => {
            const operation = collectionModify(null, null, null, ' ');

            return expect(operation.execute()).to.eventually.be.rejectedWith('remove needs a valid condition');
        });

        it('should fail if the operation results in an error', () => {
            const operation = collectionModify({ _client: { crudModify } }, { getName }, 'foo', 'bar');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('baz');
            td.when(crudModify('baz', 'foo', type, 'bar'), { ignoreExtraArgs: true }).thenReject(error);

            return expect(operation.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should succeed if the operation succeed with the state of the operation', () => {
            const operation = collectionModify({ _client: { crudModify } }, { getName }, 'foo', 'bar');
            const state = { foo: 'bar' };
            const expected = new Result(state);

            td.when(getName()).thenReturn('baz');
            td.when(crudModify('baz', 'foo', type, 'bar'), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(operation.execute()).to.eventually.deep.equal(expected);
        });
    });
});
