'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Client = require('lib/Protocol/Client');
const TableDelete = require('lib/DevAPI/TableDelete');
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('TableDelete', () => {
    let crudRemove, getName;
    let type = Client.dataModel.TABLE;

    beforeEach('create fakes', () => {
        crudRemove = td.function();
        getName = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('where()', () => {
        it('should set the operation condition', () => {
            const query = 'foo';
            const operation = (new TableDelete()).where(query);

            expect(operation._query).to.equal(query);
        });
    });

    context('execute()', () => {
        it('should fail if a condition query is not provided', () => {
            const operation = new TableDelete();

            return expect(operation.execute()).to.eventually.be.rejectedWith('delete needs a valid condition');
        });

        it('should fail if a condition query is empty', () => {
            const operation = new TableDelete(null, null, null, '');

            return expect(operation.execute()).to.eventually.be.rejectedWith('delete needs a valid condition');
        });

        it('should fail if a condition query is not valid', () => {
            const operation = new TableDelete(null, null, null, ' ');

            return expect(operation.execute()).to.eventually.be.rejectedWith('delete needs a valid condition');
        });

        it('should fail if the operation results in an error', () => {
            const operation = new TableDelete({ _client: { crudRemove } }, { getName }, 'foo', 'bar');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('baz');
            td.when(crudRemove('baz', 'foo', type, 'bar'), { ignoreExtraArgs: true }).thenReject(error);

            return expect(operation.execute()).to.eventually.be.rejectedWith(error);
        });

        it('should succeed if the operation succeed with the state of the operation', () => {
            const operation = new TableDelete({ _client: { crudRemove } }, { getName }, 'foo', 'bar');
            const state = { foo: 'bar' };
            const expected = new Result(state);

            td.when(getName()).thenReturn('baz');
            td.when(crudRemove('baz', 'foo', type, 'bar'), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(operation.execute()).to.eventually.deep.equal(expected);
        });
    });
});
