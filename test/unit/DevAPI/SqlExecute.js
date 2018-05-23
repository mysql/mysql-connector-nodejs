'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Column = require('lib/DevAPI/Column');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sqlExecute = require('lib/DevAPI/SqlExecute');
const td = require('testdouble');

describe('SqlExecute', () => {
    let sqlStmtExecute;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('should execute the context statement', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeSqlExecute = proxyquire('lib/DevAPI/SqlExecute', { './Result': fakeResult });

            const query = fakeSqlExecute({ _client: { sqlStmtExecute } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(sqlStmtExecute(query), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should call a result handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });

            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo')), { ignoreExtraArgs: true }).thenResolve();

            return query.execute(actual => expect(actual).to.equal('foo'));
        });

        it('should call a metadata handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const meta = ['foo'];

            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback([meta]))).thenResolve();

            return query.execute(td.function(), actual => expect(actual).to.deep.equal([new Column(meta)]));
        });

        it('should call a handlers provided as an `execute` object argument', () => {
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

        it('should fail if an unexpected error is thrown', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const error = new Error('foobar');

            td.when(sqlStmtExecute(), { ignoreExtraArgs: true }).thenReject(error);

            return query.execute().catch(err => expect(err).to.deep.equal(error));
        });
    });
});
