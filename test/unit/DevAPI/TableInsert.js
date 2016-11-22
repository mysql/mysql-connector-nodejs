'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const TableInsert = require('lib/DevAPI/TableInsert');
const expect = require('chai').expect;
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

    context('execute()', () => {
        it('should include the fields and projection values', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = new TableInsert(fakeSession, fakeSchema, 'table', ['foo', 'bar']).values(['baz', 'qux']);
            const projection = [{ name: 'foo' }, { name: 'bar' }];

            td.when(crudInsert('schema', 'table', Client.dataModel.TABLE, [['baz', 'qux']], projection)).thenResolve(state);

            return query.execute().should.eventually.deep.equal(expected);
        });
    });

    context('values()', () => {
        it('should be fluent', () => {
            const query = (new TableInsert(null, null, null, ['foo'])).values('bar');

            expect(query).to.be.an.instanceof(TableInsert);
        });

        it('should set the rows provided as an array', () => {
            const values = ['baz', 'qux'];
            const query = (new TableInsert(null, null, null, ['foo', 'bar'])).values(values);

            expect(query._rows).to.deep.equal([values]);
        });

        it('should set the rows provided as arguments', () => {
            const values = ['baz', 'qux'];
            const query = (new TableInsert(null, null, null, ['foo', 'bar'])).values(values[0], values[1]);

            expect(query._rows).to.deep.equal([values]);
        });

        it('should throw error if the number of fields and rows do not match', () => {
            const values = ['baz', 'qux'];
            const query = (new TableInsert(null, null, null, ['foo']));

            expect(() => query.values(values[0], values[1])).to.throw(Error);
        });
    });
});
