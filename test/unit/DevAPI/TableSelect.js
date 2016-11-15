'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const TableSelect = require('lib/DevAPI/TableSelect');
const expect = require('chai').expect;
const parseExpressionInputs = require('lib/DevAPI/Util/parseExpressionInputs');
const td = require('testdouble');

describe('TableSelect', () => {
    let crudFind, getName, fakeSchema, fakeSession;

    beforeEach('create fake session', () => {
        crudFind = td.function();
        fakeSession = { _client: { crudFind } };
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
        it('should acknowledge the projection values', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = new TableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            const call = crudFind(fakeSession, 'schema', 'table', Client.dataModel.TABLE, parseExpressionInputs(['foo', 'bar']));
            td.when(call, { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute().should.eventually.deep.equal(expected);
        });
    });

    context('getViewDefinition()', () => {
        it('should generate a simple projection table view query', () => {
            const expected = 'SELECT foo, bar FROM schema.table';
            const query = new TableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a filtered table view query', () => {
            const expected = 'SELECT * FROM schema.table WHERE foo = "baz"';
            const query = (new TableSelect(fakeSession, fakeSchema, 'table', ['*'])).where('foo = "baz"');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a ordered table view query', () => {
            const expected = 'SELECT foo FROM schema.table ORDER BY bar';
            const query = (new TableSelect(fakeSession, fakeSchema, 'table', ['foo'])).orderBy(['bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });
    });

    context('limit()', () => {
        it('should set `count` and `offset` properties in the _limit variable', () => {
            const query = (new TableSelect(fakeSession, fakeSchema, 'table', [])).limit(10, 0);

            expect(query._limit).to.deep.equal({ count: 10, offset: 0 });
        });
    });
});
