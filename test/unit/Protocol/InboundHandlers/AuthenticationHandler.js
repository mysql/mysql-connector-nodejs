/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let AuthenticationHandler = require('../../../../lib/Protocol/InboundHandlers/AuthenticationHandler');

describe('AuthenticationHandler inbound handler', () => {
    let authenticateContinue, authenticateOk, info, logger, notice, sessionStateChanged;

    beforeEach('create fakes', () => {
        info = td.function();

        authenticateContinue = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateContinue');
        authenticateOk = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateOk');
        notice = td.replace('../../../../lib/Protocol/Wrappers/Messages/Notice/Frame');
        logger = td.replace('../../../../lib/logger');
        sessionStateChanged = td.replace('../../../../lib/Protocol/Wrappers/Messages/Notice/SessionStateChanged');

        td.when(logger('protocol:inbound:Mysqlx')).thenReturn({ info });

        AuthenticationHandler = require('../../../../lib/Protocol/InboundHandlers/AuthenticationHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Notice.Frame message is received', () => {
        it('extracts the connection id from the payload list of values', () => {
            const handler = new AuthenticationHandler();
            const getTypeId = td.function();
            const getPayload = td.function();
            const getParameterId = td.function();
            const toObject = td.function();

            td.when(notice.deserialize('foo')).thenReturn({ getTypeId, getPayload });
            td.when(getTypeId()).thenReturn(notice.Type.SESSION_STATE_CHANGED);
            td.when(getPayload()).thenReturn({ getParameterId, toObject });
            td.when(getParameterId()).thenReturn(sessionStateChanged.Parameter.CLIENT_ID_ASSIGNED);
            td.when(toObject()).thenReturn({ values: ['bar', 'baz'] });

            handler[notice.MESSAGE_ID]('foo');

            expect(handler._connectionId).to.equal('bar');
        });

        it('does nothing if it is not a SESSION_STATE_CHANGED notice type', () => {
            const handler = new AuthenticationHandler();
            const getTypeId = td.function();

            td.when(notice.deserialize('foo')).thenReturn({ getTypeId });
            td.when(getTypeId()).thenReturn(notice.Type.UNKNOWN);

            handler[notice.MESSAGE_ID]('foo');

            return expect(handler._connectionId).to.not.exist;
        });

        it('does nothing if is not a CLIENT_ID_ASSIGNED notice', () => {
            const handler = new AuthenticationHandler();
            const getTypeId = td.function();
            const getPayload = td.function();
            const getParameterId = td.function();

            td.when(notice.deserialize('foo')).thenReturn({ getTypeId, getPayload });
            td.when(getTypeId()).thenReturn(notice.Type.SESSION_STATE_CHANGED);
            td.when(getPayload()).thenReturn({ getParameterId });
            td.when(getParameterId()).thenReturn(sessionStateChanged.Parameter.UNKNOWN);

            handler[notice.MESSAGE_ID]('foo');

            return expect(handler._connectionId).to.not.exist;
        });

        it('logs the protocol message', () => {
            const handler = new AuthenticationHandler();
            const getTypeId = td.function();
            const inboundNotice = { getTypeId };

            td.when(notice.deserialize('foo')).thenReturn(inboundNotice);
            td.when(getTypeId()).thenReturn(notice.Type.UNKNOWN);

            handler[notice.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Notice.Frame');
            expect(td.explain(info).calls[0].args[1]).to.equal(inboundNotice);
        });
    });

    context('when a Mysqlx.Session.AuthenticateContinue message is received', () => {
        it('tries the next authentication step', () => {
            const authenticator = { getNextAuthData: td.function() };
            const client = { authenticateContinue: td.function() };
            const handler = new AuthenticationHandler(authenticator, client);

            const authentication = { toObject: td.function() };

            td.when(authenticateContinue.deserialize(), { ignoreExtraArgs: true }).thenReturn(authentication);
            td.when(authentication.toObject()).thenReturn({ authData: 'bar' });
            td.when(authenticator.getNextAuthData(Buffer.from('bar', 'base64'))).thenReturn('baz');

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
                expect(td.explain(info).calls[0].args[0]).to.equal('Session.AuthenticateContinue');
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
                td.when(authenticator.getNextAuthData(Buffer.from('bar', 'base64'))).thenReturn('baz');
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
                td.when(authenticator.getNextAuthData(Buffer.from('bar', 'base64'))).thenReturn('baz');
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
                td.when(authenticator.getNextAuthData(Buffer.from('bar', 'base64'))).thenReturn('baz');
                td.when(client.authenticateContinue('baz', handler)).thenThrow();

                handler[authenticateContinue.MESSAGE_ID]('foo', () => {});

                expect(td.explain(info).callCount).to.equal(1);
                expect(td.explain(info).calls[0].args[0]).to.equal('Session.AuthenticateContinue');
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

        it('invokes the finishing success handler with the connection id', () => {
            const handler = new AuthenticationHandler();
            handler._connectionId = 'bar';
            handler._resolve = td.function();

            td.when(authenticateOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[authenticateOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            expect(td.explain(handler._resolve).calls[0].args[0]).deep.equal({ connectionId: 'bar' });
        });

        it('logs the protocol message', () => {
            const handler = new AuthenticationHandler();
            handler._resolve = td.function();

            td.when(authenticateOk.deserialize('foo')).thenReturn('bar');

            handler[authenticateOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Session.AuthenticateOk');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });
});
