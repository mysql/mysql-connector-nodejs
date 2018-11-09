'use strict';

/* eslint-env node, mocha */

const Column = require('../../../lib/DevAPI/Column');
const expect = require('chai').expect;
const td = require('testdouble');

describe('SqlExecute', () => {
    let fakeResult, sqlExecute, sqlStmtExecute;

    beforeEach('create fakes', () => {
        fakeResult = td.function();
        sqlStmtExecute = td.function();

        td.replace('../../../lib/DevAPI/SqlResult', fakeResult);
        sqlExecute = require('../../../lib/DevAPI/SqlExecute');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('executes the context statement', () => {
            const expected = { done: true };
            const state = { ok: true };

            const query = sqlExecute({ _client: { sqlStmtExecute } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(sqlStmtExecute(query), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute()
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('calls a result handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });

            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo')), { ignoreExtraArgs: true }).thenResolve();

            return query.execute(actual => expect(actual).to.equal('foo'));
        });

        it('calls a metadata handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const meta = ['foo'];

            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback([meta]))).thenResolve();

            return query.execute(td.function(), actual => expect(actual).to.deep.equal([new Column(meta)]));
        });

        it('calls a handlers provided as an `execute` object argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const meta = ['bar'];

            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo'), td.callback([meta]))).thenResolve();

            return query.execute({
                row (actual) {
                    expect(actual).to.equal('foo');
                },
                meta (actual) {
                    expect(actual).to.deep.equal([new Column(meta)]);
                }
            });
        });

        it('fails if an unexpected error is thrown', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const error = new Error('foobar');

            td.when(sqlStmtExecute(), { ignoreExtraArgs: true }).thenReject(error);

            return query.execute().catch(err => expect(err).to.deep.equal(error));
        });
    });
});
