'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let AuthenticationHandler = require('../../../../lib/Protocol/InboundHandlers/AuthenticationHandler');

describe('AuthenticationHandler inbound handler', () => {
    let authenticateContinue, authenticateOk, info, logger;

    beforeEach('create fakes', () => {
        info = td.function();

        authenticateContinue = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateContinue');
        authenticateOk = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateOk');
        logger = td.replace('../../../../lib/tool/log');

        td.when(logger('protocol:inbound:Mysqlx.Session')).thenReturn({ info });

        AuthenticationHandler = require('../../../../lib/Protocol/InboundHandlers/AuthenticationHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Session.AuthenticateContinue message is received', () => {
        it('tries the next authentication step', () => {
            const authenticator = { getNextAuthData: td.function() };
            const client = { authenticateContinue: td.function() };
            const handler = new AuthenticationHandler(authenticator, client);

            const authentication = { toObject: td.function() };

            td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
            td.when(authentication.toObject()).thenReturn({ authData: 'bar' });
            // eslint-disable-next-line node/no-deprecated-api
            td.when(authenticator.getNextAuthData(new Buffer('bar', 'base64'))).thenReturn('baz');

            handler[authenticateContinue.MESSAGE_ID]('foo');

            expect(td.explain(client.authenticateContinue).callCount).to.equal(1);
            expect(td.explain(client.authenticateContinue).calls[0].args[0]).to.equal('baz');
            expect(td.explain(client.authenticateContinue).calls[0].args[1]).to.equal(handler);
        });

        context('and the next authentication step succeeds', () => {
            it('does not finish the associated job in the queue', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);

                const queueDone = td.function();
                const authentication = { toObject: td.function() };

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });

                handler[authenticateContinue.MESSAGE_ID]('foo', queueDone);

                expect(td.explain(queueDone).callCount).to.equal(0);
            });

            it('does not invoke the finishing error handler', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);
                handler._fail = td.function();

                const authentication = { toObject: td.function() };

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });

                handler[authenticateContinue.MESSAGE_ID]('foo');

                expect(td.explain(handler._fail).callCount).to.equal(0);
            });

            it('logs the protocol message', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);

                const authentication = { toObject: td.function() };

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });

                handler[authenticateContinue.MESSAGE_ID]('foo');

                expect(td.explain(info).callCount).to.equal(1);
                expect(td.explain(info).calls[0].args[0]).to.equal('AuthenticateContinue');
                expect(td.explain(info).calls[0].args[1]).to.equal(authentication);
            });
        });

        context('and the next authentication step fails', () => {
            it('finishes the associated job in the queue', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);
                handler._fail = () => {};

                const queueDone = td.function();
                const authentication = { toObject: td.function() };

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });
                // eslint-disable-next-line node/no-deprecated-api
                td.when(authenticator.getNextAuthData(new Buffer('bar', 'base64'))).thenReturn('baz');
                td.when(client.authenticateContinue('baz', handler)).thenThrow();

                handler[authenticateContinue.MESSAGE_ID]('foo', queueDone);

                expect(td.explain(queueDone).callCount).to.equal(1);
                return expect(td.explain(queueDone).calls[0].args).to.be.an('array').and.be.empty;
            });

            it('invokes the finishing error handler', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);
                handler._fail = td.function();

                const authentication = { toObject: td.function() };
                const error = new Error('foobar');

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });
                // eslint-disable-next-line node/no-deprecated-api
                td.when(authenticator.getNextAuthData(new Buffer('bar', 'base64'))).thenReturn('baz');
                td.when(client.authenticateContinue('baz', handler)).thenThrow(error);

                handler[authenticateContinue.MESSAGE_ID]('foo', () => {});

                expect(td.explain(handler._fail).callCount).to.equal(1);
                expect(td.explain(handler._fail).calls[0].args[0]).to.deep.equal(error);
            });

            it('logs the protocol message', () => {
                const authenticator = { getNextAuthData: td.function() };
                const client = { authenticateContinue: td.function() };
                const handler = new AuthenticationHandler(authenticator, client);
                handler._fail = () => {};

                const authentication = { toObject: td.function() };

                td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
                td.when(authentication.toObject()).thenReturn({ authData: 'bar' });
                // eslint-disable-next-line node/no-deprecated-api
                td.when(authenticator.getNextAuthData(new Buffer('bar', 'base64'))).thenReturn('baz');
                td.when(client.authenticateContinue('baz', handler)).thenThrow();

                handler[authenticateContinue.MESSAGE_ID]('foo', () => {});

                expect(td.explain(info).callCount).to.equal(1);
                expect(td.explain(info).calls[0].args[0]).to.equal('AuthenticateContinue');
                expect(td.explain(info).calls[0].args[1]).to.equal(authentication);
            });
        });
    });

    context('when a Mysqlx.Session.AuthenticationOk message is received', () => {
        it('finishes the associated job in the queue', () => {
            const handler = new AuthenticationHandler();
            handler._resolve = () => {};

            const queueDone = td.function();

            td.when(authenticateOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[authenticateOk.MESSAGE_ID]('foo', queueDone);

            expect(td.explain(queueDone).callCount).to.equal(1);
            return expect(td.explain(queueDone).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('invokes the finishing handler', () => {
            const handler = new AuthenticationHandler();
            handler._resolve = td.function();

            td.when(authenticateOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[authenticateOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            return expect(td.explain(handler._resolve).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('logs the protocol message', () => {
            const handler = new AuthenticationHandler();
            handler._resolve = td.function();

            td.when(authenticateOk.deserialize('foo')).thenReturn('bar');

            handler[authenticateOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('AuthenticateOk');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });
});
