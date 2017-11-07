'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Column = require('lib/DevAPI/Column');
const Statement = require('lib/DevAPI/Statement');
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const td = require('testdouble');

describe.skip('Statement', () => {
    let sqlStmtExecute;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('should execute the context statement', () => {
            const query = new Statement({ sqlStmtExecute }, 'foo');
            const state = 'bar';
            const expected = new Result(state);

            td.when(sqlStmtExecute('foo', []), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute().then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should provide the context arguments when executing the statement', () => {
            const query = new Statement({ sqlStmtExecute }, 'foo', 'bar');
            const state = 'baz';
            const expected = new Result(state);

            td.when(sqlStmtExecute('foo', 'bar'), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute().then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should call a result handler provided as an `execute` argument', () => {
            const query = new Statement({ sqlStmtExecute });

            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback('foo')), { ignoreExtraArgs: true }).thenResolve();

            return query.execute(actual => expect(actual).to.equal('foo'));
        });

        it('should call a metadata handler provided as an `execute` argument', () => {
            const query = new Statement({ sqlStmtExecute });
            const meta = ['foo'];

            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.matchers.anything(), td.callback([meta]))).thenResolve();

            return query.execute(td.function(), actual => expect(actual).to.deep.equal([new Column(meta)]));
        });

        it('should call a handlers provided as an `execute` object argument', () => {
            const query = new Statement({ sqlStmtExecute });
            const meta = ['bar'];

            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback('foo'), td.callback([meta]))).thenResolve();

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
            const query = new Statement({ sqlStmtExecute });
            const error = new Error('foobar');

            td.when(sqlStmtExecute(), { ignoreExtraArgs: true }).thenReject(error);

            return query.execute().catch(err => expect(err).to.deep.equal(error));
        });
    });
});
