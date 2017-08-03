'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const tableInsert = require('lib/DevAPI/TableInsert');
const td = require('testdouble');

describe('TableInsert', () => {
    let crudInsert, getName, fakeSchema, fakeSession;

    beforeEach('create fake session', () => {
        crudInsert = td.function();
        fakeSession = { _client: { crudInsert } };
    });

    beforeEach('create fake schema', () => {
        getName = td.function();
        fakeSchema = { getName };

        td.when(getName()).thenReturn('schema');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableInsert().getClassName()).to.equal('TableInsert');
        });
    });

    context('execute()', () => {
        it('should include the fields and projection values', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableInsert(fakeSession, fakeSchema, 'table', ['foo', 'bar']).values(['baz', 'qux']);
            const columns = [{ name: 'foo' }, { name: 'bar' }];
            const rows = [['baz', 'qux']];

            td.when(crudInsert('schema', 'table', Client.dataModel.TABLE, { columns, rows })).thenResolve(state);

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

            expect(query.getRows()).to.deep.equal([values]);
        });

        it('should set the rows provided as arguments', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo', 'bar']).values(values[0], values[1]);

            expect(query.getRows()).to.deep.equal([values]);
        });

        it('should throw error if the number of fields and rows do not match', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo']);

            expect(() => query.values(values[0], values[1])).to.throw(Error);
        });
    });
});
