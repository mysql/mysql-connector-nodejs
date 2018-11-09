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
        it('generates a new statement id if none is available', () => {
            const session = { _statements: [true, true] };
            const statement = preparing({ session });

            statement.allocate();
            return expect(statement.getStatementId()).to.equal(3);
        });

        it('returns the first free statement id if one is available', () => {
            const session = { _statements: [true, undefined, true] };
            const statement = preparing({ session });

            statement.allocate();
            return expect(statement.getStatementId()).to.equal(2);
        });
    });

    context('deallocate()', () => {
        let deallocate;

        beforeEach('create fakes', () => {
            deallocate = td.function();
        });

        it('deallocates a statement in the server', () => {
            const session = { _client: { deallocate }, _statements: [] };
            const statement = preparing({ session });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(actual => expect(actual).to.deep.equal(statement));
        });

        it('requires the statement to restart in the next execution if the query scope changes', () => {
            const session = { _client: { deallocate }, _statements: [] };
            const statement = preparing({ session, stage: preparing.Stages.TO_RESTART });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => expect(statement.getStage()).to.equal(preparing.Stages.TO_START));
        });

        it('requires the statement to be re-prepared in the next execution if the query scope does not change', () => {
            const session = { _client: { deallocate }, _statements: [] };
            const statement = preparing({ session, stage: preparing.Stages.TO_REPREPARE });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => expect(statement.getStage()).to.equal(preparing.Stages.TO_PREPARE));
        });

        it('releases the statement in the client', () => {
            const session = { _client: { deallocate }, _statements: ['foo', 'bar'] };
            const statement = preparing({ session, statementId: 1 });

            td.when(deallocate(statement)).thenResolve();

            return statement.deallocate()
                .then(() => expect(session._statements).to.deep.equal([undefined, 'bar']));
        });

        it('fails if an unexpected error occurs while deallocating the statement in the server', () => {
            const error = new Error('foobar');
            const session = { _client: { deallocate }, _statements: [] };
            const statement = preparing({ session });

            td.when(deallocate(statement)).thenReject(error);

            return statement.deallocate()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('execute()', () => {
        it('executes a plain statement on the first attempt', () => {
            const statement = preparing();
            const executePlain = td.replace(statement, 'executePlain');

            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => expect(actual).to.equal('bar'));
        });

        it('executes a plain statement when the session does not support prepared statements', () => {
            const statement = preparing({ stage: preparing.Stages.TO_SKIP });
            const executePlain = td.replace(statement, 'executePlain');

            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => expect(actual).to.equal('bar'));
        });

        it('prepares a statement and executes it when the scope does not change', () => {
            const prepare = td.function();
            const session = { _client: { prepare } };
            const statement = preparing({ session, stage: preparing.Stages.TO_PREPARE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.replace(statement, 'allocate');
            td.when(prepare(statement)).thenResolve();
            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => expect(actual).to.equal('qux'));
        });

        it('executes a plain statement when the server does not support prepared statements', () => {
            const statement = preparing({ stage: preparing.Stages.TO_PREPARE });
            const prepare = td.replace(statement, 'prepare');
            const handlePrepareError = td.replace(statement, 'handlePrepareError');

            td.when(prepare()).thenReject('qux');
            td.when(handlePrepareError('qux', 'foo')).thenResolve('quux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => expect(actual).to.equal('quux'));
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
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('executes a statement that has been previously prepared', () => {
            const statement = preparing({ stage: preparing.Stages.TO_EXECUTE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => expect(actual).to.equal('qux'));
        });

        it('deallocates a statement that has been re-created and executes it', () => {
            const deallocate = td.function();
            const session = { _client: { deallocate }, _statements: [] };
            const statement = preparing({ session, stage: preparing.Stages.TO_RESTART });
            const executePlain = td.replace(statement, 'executePlain');

            td.when(deallocate(statement)).thenResolve();
            td.when(executePlain('foo')).thenResolve('bar');

            return statement.execute('foo')
                .then(actual => expect(actual).to.equal('bar'));
        });

        it('deallocates a statement that has been modified, re-prepares and executes it', () => {
            const deallocate = td.function();
            const prepare = td.function();
            const session = { _client: { deallocate, prepare }, _statements: [] };
            const statement = preparing({ session, stage: preparing.Stages.TO_REPREPARE });
            const executePrepared = td.replace(statement, 'executePrepared');

            td.when(deallocate(statement)).thenResolve();
            td.when(prepare(statement)).thenResolve();
            td.when(executePrepared('bar', 'baz')).thenResolve('qux');

            return statement.execute('foo', 'bar', 'baz')
                .then(actual => expect(actual).to.equal('qux'));
        });
    });

    context('executePlain()', () => {
        it('executes the fallback operation wrapper', () => {
            const state = 'foo';
            const statement = preparing();
            const wrapper = td.function();

            td.when(wrapper()).thenResolve(state);

            return statement.executePlain(wrapper)
                .then(result => expect(result).to.equal(state));
        });

        it('moves the statement to the proper lifecycle stage', () => {
            const statement = preparing();
            const wrapper = td.function();

            td.when(wrapper()).thenResolve();

            return statement.executePlain(wrapper)
                .then(() => expect(statement.getStage()).to.equal(preparing.Stages.TO_PREPARE));
        });
    });

    context('executePrepared()', () => {
        let prepareExecute;

        beforeEach('create fakes', () => {
            prepareExecute = td.function();
        });

        it('executes a previously prepared statement', () => {
            const state = 'baz';
            const statement = preparing({ session: { _client: { prepareExecute } } });

            td.when(prepareExecute(statement, 'foo', 'bar')).thenResolve(state);

            return statement.executePrepared('foo', 'bar')
                .then(result => expect(result).to.equal(state));
        });

        it('leaves the statement to the proper lifecycle stage', () => {
            const stage = preparing.Stages.TO_EXECUTE;
            const statement = preparing({ session: { _client: { prepareExecute } }, stage });

            td.when(prepareExecute(), { ignoreExtraArgs: true }).thenResolve();

            return statement.executePrepared()
                .then(() => expect(statement.getStage()).to.equal(stage));
        });

        it('fails when an unexpected error is thrown', () => {
            const error = new Error('foobar');
            const statement = preparing({ session: { _client: { prepareExecute } } });

            td.when(prepareExecute(statement, 'foo', 'bar')).thenReject(error);

            return statement.executePrepared('foo', 'bar')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
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
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('disables client-side prepared statement support if the plugin does not provide it', () => {
            const session = { _statements: [], _canPrepareStatements: true };
            const statement = preparing({ session });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1047 };

            td.when(fallback()).thenResolve();

            return statement.handlePrepareError(error, fallback)
                .then(() => {
                    expect(statement.getStage()).to.equal(preparing.Stages.TO_SKIP);
                    return expect(session._canPrepareStatements).to.be.false;
                });
        });

        it('disables client-side prepared statement support if the total statement count in the server is exceeded', () => {
            const session = { _statements: [], _canPrepareStatements: true };
            const statement = preparing({ session });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1461 };

            td.when(fallback()).thenResolve();

            return statement.handlePrepareError(error, fallback)
                .then(() => {
                    expect(statement.getStage()).to.equal(preparing.Stages.TO_SKIP);
                    return expect(session._canPrepareStatements).to.be.false;
                });
        });

        it('executes a plain statement if the plugin does not support prepared statements', () => {
            const statement = preparing({ session: { _statements: [] } });
            const fallback = td.function();
            const error = new Error();
            error.info = { code: 1047 };

            td.when(fallback()).thenResolve('foo');

            return statement.handlePrepareError(error, fallback)
                .then(actual => expect(actual).to.equal('foo'));
        });
    });

    context('prepare()', () => {
        let prepare;

        beforeEach('create fakes', () => {
            prepare = td.function();
        });

        it('allocates a client-side statement', () => {
            const statement = preparing({ session: { _client: { prepare } } });
            const allocate = td.replace(statement, 'allocate');

            td.when(prepare(), { ignoreExtraArgs: true }).thenResolve();

            return statement.prepare()
                .then(() => expect(td.explain(allocate).callCount).to.equal(1));
        });

        it('moves the statement to the proper lifecycle stage after preparing it', () => {
            const statement = preparing({ session: { _client: { prepare } } });

            td.replace(statement, 'allocate');
            td.when(prepare(), { ignoreExtraArgs: true }).thenResolve();

            return statement.prepare()
                .then(() => expect(statement.getStage()).to.equal(preparing.Stages.TO_EXECUTE));
        });

        it('fails when an unexpected error is thrown when preparing the statement', () => {
            const statement = preparing({ session: { _client: { prepare } } });
            const error = new Error('foobar');

            td.replace(statement, 'allocate');
            td.when(prepare(), { ignoreExtraArgs: true }).thenReject(error);

            return statement.prepare()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });
});
