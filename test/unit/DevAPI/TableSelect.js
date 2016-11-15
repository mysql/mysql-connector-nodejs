'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const TableSelect = require('lib/DevAPI/TableSelect');
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
});
