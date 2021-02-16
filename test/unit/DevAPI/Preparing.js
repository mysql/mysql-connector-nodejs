/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const preparing = require('../../../lib/DevAPI/Preparing');
const td = require('testdouble');

describe('Preparing', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('allocate()', () => {
        let getPreparedStatements;

        beforeEach('create fakes', () => {
            getPreparedStatements = td.function();
        });

        it('generates a new statement id if none is available', () => {
            const connection = { getPreparedStatements };
            const statement = preparing({ connection });

            td.when(getPreparedStatements()).thenReturn([true, true]);

            statement.allocate();

            return expect(statement.getStatementId()).to.equal(3);
        });

        it('returns the first free statement id if one is available', () => {
            const connection = { getPreparedStatements };
            const statement = preparing({ connection });

            td.when(getPreparedStatements()).thenReturn([true, undefined, true]);

            statement.allocate();

            return expect(statement.getStatementId()).to.equal(2);
        });
    });

    context('deallocate()', () => {
        let deallocate, getClient, getPreparedStatements, removePreparedStatement;

        beforeEach('create fakes', () => {
            deallocate = td.function();
            getClient = td.function();
            getPreparedStatements = td.function();
            removePreparedStatement = td.function();

            td.when(getClient()).thenReturn({ deallocate });
        });

        it('deallocates a statement in the server', () => {
            const connection = { getClient, getPreparedStatements, removePreparedStatement };
            const statement = preparing({ connection });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(actual => {
                    return expect(actual).to.deep.equal(statement);
                });
        });

        it('requires the statement to restart in the next execution if the query scope changes', () => {
            const connection = { getClient, getPreparedStatements, removePreparedStatement };
            const statement = preparing({ connection, stage: preparing.Stages.TO_RESTART });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => {
                    return expect(statement.getStage()).to.equal(preparing.Stages.TO_START);
                });
        });

        it('requires the statement to be re-prepared in the next execution if the query scope does not change', () => {
            const connection = { getClient, getPreparedStatements, removePreparedStatement };
            const statement = preparing({ connection, stage: preparing.Stages.TO_REPREPARE });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => {
                    return expect(statement.getStage()).to.equal(preparing.Stages.TO_PREPARE);
                });
        });

        it('releases the statement in the client', () => {
            const connection = { getClient, getPreparedStatements, removePreparedStatement };
            const statement = preparing({ connection, statementId: 1 });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => {
                    expect(td.explain(removePreparedStatement).callCount).to.equal(1);
                    expect(td.explain(removePreparedStatement).calls[0].args).to.deep.equal([1]);
                });
        });

        it('fails if an unexpected error occurs while deallocating the statement in the server', () => {
            const error = new Error('foobar');
            const connection = { getClient };
            const statement = preparing({ connection });

            td.when(deallocate(statement)).thenReject(error);

            return statement.deallocate()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('execute()', () => {
        let deallocate, getClient, getPreparedStatements, prepare, removePreparedStatement;

        beforeEach('create fakes', () => {
            deallocate = td.function();
            getClient = td.function();
            getPreparedStatements = td.function();
            prepare = td.function();
            removePreparedStatement = td.function();

            td.when(getClient()).thenReturn({ deallocate, prepare });
        });

        it('executes a plain statement on the first attempt', () => {
            const statement = preparing();
            const executePlain = td.replace(statement, 'executePlain');

            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => {
                    return expect(actual).to.equal('bar');
                });
        });

        it('executes a plain statement when the session does not support prepared statements', () => {
            const statement = preparing({ stage: preparing.Stages.TO_SKIP });
            const executePlain = td.replace(statement, 'executePlain');

            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => {
                    return expect(actual).to.equal('bar');
                });
        });

        it('prepares a statement and executes it when the scope does not change', () => {
            const connection = { getClient };
            const statement = preparing({ connection, stage: preparing.Stages.TO_PREPARE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.replace(statement, 'allocate');
            td.when(prepare(statement)).thenResolve();
            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => {
                    return expect(actual).to.equal('qux');
                });
        });

        it('executes a plain statement when the server does not support prepared statements', () => {
            const statement = preparing({ stage: preparing.Stages.TO_PREPARE });
            const prepare = td.replace(statement, 'prepare');
            const handlePrepareError = td.replace(statement, 'handlePrepareError');

            td.when(prepare()).thenReject('qux');
            td.when(handlePrepareError('qux', 'foo')).thenResolve('quux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => {
                    return expect(actual).to.equal('quux');
                });
        });

        it('fails if the server sends an unexpected error', () => {
            const statement = preparing({ stage: preparing.Stages.TO_PREPARE });
            const prepare = td.replace(statement, 'prepare');
            const handlePrepareError = td.replace(statement, 'handlePrepareError');
            const error = new Error('foobar');

            td.when(prepare()).thenReject('qux');
            td.when(handlePrepareError('qux', 'foo')).thenReject(error);

            return statement.execute('foo', 'bar', 'baz')
                .then(() => expect.fail())
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('executes a statement that has been previously prepared', () => {
            const statement = preparing({ stage: preparing.Stages.TO_EXECUTE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => {
                    return expect(actual).to.equal('qux');
                });
        });

        it('deallocates a statement that has been re-created and executes it', () => {
            const connection = { getClient, removePreparedStatement };
            const statement = preparing({ connection, stage: preparing.Stages.TO_RESTART });
            const executePlain = td.replace(statement, 'executePlain');

            td.when(deallocate(statement)).thenResolve();
            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => {
                    return expect(actual).to.equal('bar');
                });
        });

        it('deallocates a statement that has been modified, re-prepares and executes it', () => {
            const connection = { getClient, getPreparedStatements, removePreparedStatement };
            const statement = preparing({ connection, stage: preparing.Stages.TO_REPREPARE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.when(getPreparedStatements()).thenReturn([]);
            td.when(deallocate(statement)).thenResolve();
            td.when(prepare(statement)).thenResolve();
            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => {
                    return expect(actual).to.equal('qux');
                });
        });
    });

    context('executePlain()', () => {
        it('executes the fallback operation wrapper', () => {
            const state = 'foo';
            const statement = preparing();
            const wrapper = td.function();

            td.when(wrapper()).thenResolve(state);

            return statement.executePlain(wrapper)
                .then(result => {
                    return expect(result).to.equal(state);
                });
        });

        it('moves the statement to the proper lifecycle stage', () => {
            const statement = preparing();
            const wrapper = td.function();

            td.when(wrapper()).thenResolve();

            return statement.executePlain(wrapper)
                .then(() => {
                    return expect(statement.getStage()).to.equal(preparing.Stages.TO_PREPARE);
                });
        });
    });

    context('executePrepared()', () => {
        let getClient, prepareExecute;

        beforeEach('create fakes', () => {
            getClient = td.function();
            prepareExecute = td.function();

            td.when(getClient()).thenReturn({ prepareExecute });
        });

        it('executes a previously prepared statement', () => {
            const state = 'baz';
            const connection = { getClient };
            const statement = preparing({ connection });

            td.when(prepareExecute(statement, 'foo', 'bar')).thenResolve(state);

            return statement.executePrepared('foo', 'bar')
                .then(result => {
                    return expect(result).to.equal(state);
                });
        });

        it('leaves the statement to the proper lifecycle stage', () => {
            const stage = preparing.Stages.TO_EXECUTE;
            const connection = { getClient };
            const statement = preparing({ connection, stage });

            td.when(prepareExecute(), { ignoreExtraArgs: true }).thenResolve();

            return statement.executePrepared()
                .then(() => {
                    return expect(statement.getStage()).to.equal(stage);
                });
        });

        it('fails when an unexpected error is thrown', () => {
            const error = new Error('foobar');
            const connection = { getClient };
            const statement = preparing({ connection });

            td.when(prepareExecute(statement, 'foo', 'bar')).thenReject(error);

            return statement.executePrepared('foo', 'bar')
                .then(() => expect.fail())
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('forceReprepare()', () => {
        it('moves the statement to the proper lifecycle stage when it is prepared', () => {
            return expect(preparing({ stage: preparing.Stages.TO_EXECUTE }).forceReprepare().getStage()).to.equal(preparing.Stages.TO_REPREPARE);
        });

        it('leaves the statement in the same lifecycle stage when it is on any other stage', () => {
            return expect(preparing({ stage: preparing.Stages.TO_PREPARE }).forceReprepare().getStage()).to.equal(preparing.Stages.TO_PREPARE);
        });
    });

    context('forceRestart()', () => {
        it('moves the statement to the proper lifecycle stage when it is prepared', () => {
            return expect(preparing({ stage: preparing.Stages.TO_EXECUTE }).forceRestart().getStage()).to.equal(preparing.Stages.TO_RESTART);
        });

        it('moves the statement to the proper lifecycle stage when it is on any other stage', () => {
            return expect(preparing({ stage: preparing.Stages.TO_PREPARE }).forceRestart().getStage()).to.equal(preparing.Stages.TO_START);
        });
    });

    context('handlePrepareError', () => {
        it('fails with an unexpected error', () => {
            const statement = preparing();
            const error = new Error('foobar');

            return statement.handlePrepareError(error, 'foo')
                .then(() => expect.fail())
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('disables client-side prepared statement support if the plugin does not provide it', () => {
            const disablePreparedStatements = td.function();
            const connection = { disablePreparedStatements };
            const statement = preparing({ connection });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1047 };

            td.when(fallback()).thenResolve();

            return statement.handlePrepareError(error, fallback)
                .then(() => {
                    expect(statement.getStage()).to.equal(preparing.Stages.TO_SKIP);
                    return expect(td.explain(disablePreparedStatements).callCount).to.equal(1);
                });
        });

        it('disables client-side prepared statement support if the total statement count in the server is exceeded', () => {
            const disablePreparedStatements = td.function();
            const connection = { disablePreparedStatements };
            const statement = preparing({ connection });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1461 };

            td.when(fallback()).thenResolve();

            return statement.handlePrepareError(error, fallback)
                .then(() => {
                    expect(statement.getStage()).to.equal(preparing.Stages.TO_SKIP);
                    return expect(td.explain(disablePreparedStatements).callCount).to.equal(1);
                });
        });

        it('executes a plain statement if the plugin does not support prepared statements', () => {
            const disablePreparedStatements = td.function();
            const connection = { disablePreparedStatements };
            const statement = preparing({ connection });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1047 };

            td.when(fallback()).thenResolve('foo');

            return statement.handlePrepareError(error, fallback)
                .then(actual => {
                    expect(actual).to.equal('foo');
                    return expect(td.explain(disablePreparedStatements).callCount).to.equal(1);
                });
        });
    });

    context('prepare()', () => {
        let getClient, prepare;

        beforeEach('create fakes', () => {
            getClient = td.function();
            prepare = td.function();

            td.when(getClient()).thenReturn({ prepare });
        });

        it('allocates a client-side statement', () => {
            const connection = { getClient };
            const statement = preparing({ connection });
            const allocate = td.replace(statement, 'allocate');

            td.when(prepare(), { ignoreExtraArgs: true }).thenResolve();

            return statement.prepare()
                .then(() => {
                    return expect(td.explain(allocate).callCount).to.equal(1);
                });
        });

        it('moves the statement to the proper lifecycle stage after preparing it', () => {
            const connection = { getClient };
            const statement = preparing({ connection });

            td.replace(statement, 'allocate');
            td.when(prepare(), { ignoreExtraArgs: true }).thenResolve();

            return statement.prepare()
                .then(() => {
                    return expect(statement.getStage()).to.equal(preparing.Stages.TO_EXECUTE);
                });
        });

        it('fails when an unexpected error is thrown when preparing the statement', () => {
            const connection = { getClient };
            const statement = preparing({ connection });
            const error = new Error('foobar');

            td.replace(statement, 'allocate');
            td.when(prepare(), { ignoreExtraArgs: true }).thenReject(error);

            return statement.prepare()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });
});
