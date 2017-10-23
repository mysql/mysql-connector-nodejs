'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const tableInsert = require('lib/DevAPI/TableInsert');
const td = require('testdouble');

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

        it('should pass itself to the client implementation', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableInsert({ _client: { crudInsert } });

            td.when(crudInsert(query)).thenResolve(state);

            return query.execute().should.eventually.deep.equal(expected);
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
