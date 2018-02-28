'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const tableInsert = require('lib/DevAPI/TableInsert');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('TableInsert', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableInsert().getClassName()).to.equal('TableInsert');
        });
    });

    context('execute()', () => {
        let crudInsert;

        beforeEach('create fake session', () => {
            crudInsert = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeTableInsert = proxyquire('lib/DevAPI/TableInsert', { './Result': fakeResult });

            const query = fakeTableInsert({ _client: { crudInsert } });

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudInsert(query)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });

    context('values()', () => {
        it('should be fluent', () => {
            const query = tableInsert(null, null, null, ['foo']).values('bar');

            expect(query.values).to.be.a('function');
        });

        it('should set the rows provided as an array', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo', 'bar']).values(values);

            expect(query.getItems()).to.deep.equal([values]);
        });

        it('should set the rows provided as arguments', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo', 'bar']).values(values[0], values[1]);

            expect(query.getItems()).to.deep.equal([values]);
        });

        it('should throw error if the number of fields and rows do not match', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo']);

            expect(() => query.values(values[0], values[1])).to.throw(Error);
        });
    });
});
