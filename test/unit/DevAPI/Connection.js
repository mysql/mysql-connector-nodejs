/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

const PassThrough = require('stream').PassThrough;
const errors = require('../../../lib/constants/errors');
const warnings = require('../../../lib/constants/warnings');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let connection = require('../../../lib/DevAPI/Connection');

describe('X DevAPI Connection', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('allowsAuthenticationWith()', () => {
        it('checks if the connection supports authentication with a given mechanism', () => {
            // PLAIN is always supported
            /* eslint-disable no-unused-expressions */
            expect(connection().allowsAuthenticationWith('PLAIN')).to.be.true;
            expect(connection().allowsAuthenticationWith('foo')).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(connection().addCapabilities({ 'authentication.mechanisms': 'foo' }).allowsAuthenticationWith('foo')).to.be.true;
        });
    });

    context('allowsAuthenticationRetry()', () => {
        it('allows to retry the authentication strategy fallback supported by the server if the connection does not use a custom authentication mechanism and is not secure', () => {
            const con = connection({ tls: { enabled: false } });
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const hasCustomAuthenticationMechanism = td.replace(con, 'hasCustomAuthenticationMechanism');

            td.when(hasCustomAuthenticationMechanism()).thenReturn(false);
            td.when(allowsAuthenticationWith('SHA256_MEMORY')).thenReturn(true);

            return expect(con.allowsAuthenticationRetry()).to.be.true;
        });

        it('does not allow to retry the authentication strategy if the connection uses a custom authentication mechanism', () => {
            const con = connection();
            const hasCustomAuthenticationMechanism = td.replace(con, 'hasCustomAuthenticationMechanism');

            td.when(hasCustomAuthenticationMechanism()).thenReturn(true);

            return expect(con.allowsAuthenticationRetry()).to.be.false;
        });

        it('does not allow to retry the authentication strategy if the connection is secure', () => {
            /* eslint-disable no-unused-expressions */
            expect(connection({ tls: { enabled: true } }).allowsAuthenticationRetry()).to.be.false;
            expect(connection({ ssl: true }).allowsAuthenticationRetry()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(connection({ socket: '/path/to/file.sock' }).allowsAuthenticationRetry()).to.be.false;
        });

        it('does not allow to retry the authentication strategy if the fallback is not supported by the server', () => {
            const con = connection();
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const hasCustomAuthenticationMechanism = td.replace(con, 'hasCustomAuthenticationMechanism');

            td.when(hasCustomAuthenticationMechanism()).thenReturn(false);
            td.when(allowsAuthenticationWith('SHA256_MEMORY')).thenReturn(false);

            return expect(con.allowsAuthenticationRetry()).to.be.false;
        });
    });

    context('authenticate()', () => {
        it('negotiates the proper authentication mechanism for the connection user', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationWith('foo')).thenReturn(true);
            td.when(authenticateWith('foo')).thenResolve('bar');

            return con.authenticate()
                .then(res => {
                    return expect(res).to.equal('bar');
                });
        });

        it('retries to authenticate using SHA256_MEMORY if possible', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationRetry = td.replace(con, 'allowsAuthenticationRetry');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const error = new Error();
            error.info = { code: errors.ER_ACCESS_DENIED_ERROR };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationRetry()).thenReturn(true);
            td.when(allowsAuthenticationWith(), { ignoreExtraArgs: true }).thenReturn(true);
            td.when(authenticateWith('foo')).thenReject(error);
            td.when(authenticateWith('SHA256_MEMORY')).thenResolve('bar');

            return con.authenticate()
                .then(res => {
                    return expect(res).to.equal('bar');
                });
        });

        it('fails if the application provides a custom authentication mechanism that is not supported by the server', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationWith('foo')).thenReturn(false);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, 'foo'));
                });
        });

        it('fails if there is an unexpected error while authenticating the user with a custom authentication mechanism', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const unexpectedError = new Error();
            unexpectedError.info = { code: -1 };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationWith('foo')).thenReturn(true);
            td.when(authenticateWith('foo')).thenReject(unexpectedError);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(unexpectedError);
                });
        });

        it('fails if the selected authentication mechanism does not work and it cannot retry using SHA256_MEMORY', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationRetry = td.replace(con, 'allowsAuthenticationRetry');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const error = new Error();
            error.info = { code: errors.ER_ACCESS_DENIED_ERROR };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationRetry()).thenReturn(false);
            td.when(allowsAuthenticationWith(), { ignoreExtraArgs: true }).thenReturn(true);
            td.when(authenticateWith('foo')).thenReject(error);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('fails if the selected authentication mechanism does not work and the server does not support SHA256_MEMORY', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationRetry = td.replace(con, 'allowsAuthenticationRetry');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const authenticationError = new Error();
            authenticationError.info = { code: errors.ER_ACCESS_DENIED_ERROR };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationRetry()).thenReturn(true);
            td.when(allowsAuthenticationWith(), { ignoreExtraArgs: true }).thenReturn(false);
            td.when(authenticateWith('foo')).thenReject(authenticationError);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, 'foo'));
                });
        });

        it('fails if there is an unexpected error while authenticating the user with SHA256_MEMORY', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationRetry = td.replace(con, 'allowsAuthenticationRetry');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const authenticationError = new Error();
            authenticationError.info = { code: errors.ER_ACCESS_DENIED_ERROR };
            const unexpectedError = new Error();
            unexpectedError.info = { code: -1 };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationRetry()).thenReturn(true);
            td.when(allowsAuthenticationWith(), { ignoreExtraArgs: true }).thenReturn(true);
            td.when(authenticateWith('foo')).thenReject(authenticationError);
            td.when(authenticateWith('SHA256_MEMORY')).thenReject(unexpectedError);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(unexpectedError);
                });
        });

        it('fails if the user cannot be ultimately authenticated with SHA256_MEMORY', () => {
            const con = connection();
            const getAuth = td.replace(con, 'getAuth');
            const allowsAuthenticationWith = td.replace(con, 'allowsAuthenticationWith');
            const allowsAuthenticationRetry = td.replace(con, 'allowsAuthenticationRetry');
            const authenticateWith = td.replace(con, 'authenticateWith');
            const error = new Error();
            error.info = { code: errors.ER_ACCESS_DENIED_ERROR };

            td.when(getAuth()).thenReturn('foo');
            td.when(allowsAuthenticationRetry()).thenReturn(true);
            td.when(allowsAuthenticationWith(), { ignoreExtraArgs: true }).thenReturn(true);
            td.when(authenticateWith(), { ignoreExtraArgs: true }).thenReject(error);

            return con.authenticate()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_AUTH_MORE_INFO);
                });
        });
    });

    context('authenticateWith()', () => {
        let authenticationManager;

        beforeEach('create fakes', () => {
            authenticationManager = td.replace('../../../lib/Authentication/AuthenticationManager');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('authenticates the connection user with a given authentication mechanism', () => {
            const client = 'foo';
            const connectionId = 'bar';
            const mechanism = 'baz';
            const password = 'qux';
            const schema = 'quux';
            const user = 'quuz';
            const con = connection({ password, schema }).setClient(client);
            const getUser = td.replace(con, 'getUser');
            const plugin = td.function();
            const run = td.function();

            td.when(getUser()).thenReturn(user);
            td.when(authenticationManager.getPlugin(mechanism)).thenReturn(plugin);
            td.when(plugin({ password, schema, user })).thenReturn({ run });
            td.when(run(client)).thenResolve({ connectionId });

            return con.authenticateWith(mechanism)
                .then(con => {
                    expect(con.getAuth()).to.equal(mechanism);
                    return expect(con.getServerId()).to.equal(connectionId);
                });
        });

        // TODO(Rui): Remove after the deprecation period.
        it('authenticates the connection user using the deprecated password property', () => {
            const client = 'foo';
            const connectionId = 'bar';
            const mechanism = 'baz';
            const user = 'qux';
            const con = connection({ dbPassword: 'quux' }).setClient(client);
            const getUser = td.replace(con, 'getUser');
            const plugin = td.function();
            const run = td.function();

            td.when(getUser()).thenReturn(user);
            td.when(authenticationManager.getPlugin(mechanism)).thenReturn(plugin);
            td.when(plugin({ password: 'quux', schema: undefined, user })).thenReturn({ run });
            td.when(run(client)).thenResolve({ connectionId });

            return con.authenticateWith(mechanism)
                .then(con => {
                    expect(con.getAuth()).to.equal(mechanism);
                    return expect(con.getServerId()).to.equal(connectionId);
                });
        });

        it('authenticates the connection with a passwordless user', () => {
            const client = 'foo';
            const connectionId = 'bar';
            const mechanism = 'baz';
            const user = 'qux';
            const con = connection().setClient(client);
            const getUser = td.replace(con, 'getUser');
            const plugin = td.function();
            const run = td.function();

            td.when(getUser()).thenReturn(user);
            td.when(authenticationManager.getPlugin(mechanism)).thenReturn(plugin);
            td.when(plugin({ password: '', schema: undefined, user })).thenReturn({ run });
            td.when(run(client)).thenResolve({ connectionId });

            return con.authenticateWith(mechanism)
                .then(con => {
                    expect(con.getAuth()).to.equal(mechanism);
                    return expect(con.getServerId()).to.equal(connectionId);
                });
        });

        it('fails if the user cannot be authenticated', () => {
            const client = 'foo';
            const mechanism = 'baz';
            const user = 'qux';
            const con = connection().setClient(client);
            const getUser = td.replace(con, 'getUser');
            const plugin = td.function();
            const run = td.function();
            const error = new Error('foobar');

            td.when(getUser()).thenReturn(user);
            td.when(authenticationManager.getPlugin(mechanism)).thenReturn(plugin);
            td.when(plugin({ password: '', schema: undefined, user })).thenReturn({ run });
            td.when(run(client)).thenReject(error);

            return con.authenticateWith(mechanism)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('capabilitiesGet()', () => {
        let Client;

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('returns the set of connection capabilities accepted by the server', () => {
            const client = new Client();

            td.when(Client.prototype.capabilitiesGet()).thenResolve('foo');

            return connection().setClient(client).capabilitiesGet()
                .then(res => {
                    return expect(res).to.equal('foo');
                });
        });

        it('fails if the X Protocol client instance reports an error', () => {
            const client = new Client();
            const error = new Error('foobar');

            td.when(Client.prototype.capabilitiesGet()).thenReject(error);

            return connection().setClient(client).capabilitiesGet()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('capabilitiesSet()', () => {
        let Client;

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('enables TLS support in the server for connections using TLS', () => {
            const con = connection({ endpoints: [{ host: 'foo' }], tls: { enabled: true } }).setClient(new Client());

            td.when(Client.prototype.capabilitiesSet(td.matchers.contains({ tls: true }))).thenResolve();

            return con.capabilitiesSet()
                .then(res => {
                    return expect(res).to.deep.include({ tls: true });
                });
        });

        it('does not enable TLS support in the server for connections using a local Unix socket', () => {
            const capabilities = { tls: true };
            const con = connection({ endpoints: [{ socket: 'foo' }] }).setClient(new Client());

            td.when(Client.prototype.capabilitiesSet(td.matchers.argThat(capabilities => Object.keys(capabilities).indexOf('tls') === -1))).thenResolve();

            return con.capabilitiesSet()
                .then(res => {
                    return expect(res).to.not.deep.include(capabilities);
                });
        });

        it('sends the default set of client session attributes when the application does not provide any', () => {
            const clientAttributes = connection.CLIENT_SESSION_ATTRIBUTES;
            const capabilities = { session_connect_attrs: clientAttributes };
            const con = connection().setClient(new Client());

            td.when(Client.prototype.capabilitiesSet(td.matchers.contains(capabilities))).thenResolve();

            return con.capabilitiesSet()
                .then(res => {
                    return expect(res).to.deep.include(capabilities);
                });
        });

        it('sends the stringified version of any custom attribute provided by the application', () => {
            const applicationAttributes = { foo: 'bar', baz: 10, qux: ['quux', 'quuz'], corge: { grault: 'garply' } };
            const clientAttributes = connection.CLIENT_SESSION_ATTRIBUTES;
            const capabilities = { session_connect_attrs: Object.assign({}, clientAttributes, { foo: 'bar', baz: '10', qux: '["quux","quuz"]', corge: '{"grault":"garply"}' }) };
            const con = connection({ connectionAttributes: applicationAttributes }).setClient(new Client());

            td.when(Client.prototype.capabilitiesSet(td.matchers.contains(capabilities))).thenResolve();

            return con.capabilitiesSet()
                .then(res => {
                    return expect(res).to.deep.include(capabilities);
                });
        });

        it('does not send session attributes when they are explicitely disabled by the application', () => {
            const capability = 'session_connect_attrs';
            const con = connection({ connectionAttributes: false }).setClient(new Client());

            td.when(Client.prototype.capabilitiesSet(td.matchers.argThat(capabilities => Object.keys(capabilities).indexOf(capability) === -1))).thenResolve();

            return con.capabilitiesSet()
                .then(res => {
                    return expect(res).to.not.deep.include.keys(capability);
                });
        });

        it('destroys and re-creates the connection without capabilities the server does not know', () => {
            const capability = 'foo';
            const destroy = td.function();
            const con = connection({ connectionAttributes: false }).setClient(new Client());
            const unknownCapabilityError = new Error(`Capability '${capability}' doesn't exist`);
            unknownCapabilityError.info = { code: errors.ER_X_CAPABILITY_NOT_FOUND };

            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true }).thenReject(unknownCapabilityError);
            td.when(Client.prototype.getConnection()).thenReturn({ destroy });

            return con.capabilitiesSet()
                .then(() => {
                    return expect.fail();
                })
                .catch(() => {
                    expect(td.explain(destroy).callCount).to.equal(1);
                    expect(td.explain(destroy).calls[0].args).to.deep.equal([unknownCapabilityError]);
                    // eslint-disable-next-line no-unused-expressions
                    expect(con.isReconnecting()).to.be.true;
                    return expect(con.getUnknownCapabilities()).to.deep.equal(['foo']);
                });
        });

        it('fails when the X Plugin does not allow to enable TLS', () => {
            const tlsError = new Error("Capability prepare failed for 'tls'");
            tlsError.info = { code: errors.ER_X_CAPABILITIES_PREPARE_FAILED };

            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true }).thenReject(tlsError);

            return connection().setClient(new Client()).capabilitiesSet()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
                });
        });

        it('fails when the X Plugin fails to prepare a capability not related to TLS', () => {
            const message = "Capability prepare failed for 'foo'";
            const capabilityPrepareError = new Error(message);
            capabilityPrepareError.info = { code: errors.ER_X_CAPABILITIES_PREPARE_FAILED };

            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true }).thenReject(capabilityPrepareError);

            return connection().setClient(new Client()).capabilitiesSet()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(message);
                });
        });

        it('fails if the X Protocol client instance reports an unexpected error', () => {
            const unexpectedError = new Error('foobar');

            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true }).thenReject(unexpectedError);

            return connection().setClient(new Client()).capabilitiesSet()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(unexpectedError);
                });
        });
    });

    context('close()', () => {
        it('closes the X Protocol connection and the underlying connection socket', () => {
            const con = connection();
            const destroy = td.replace(con, 'destroy');

            td.when(destroy()).thenResolve('foo');

            return con.close()
                .then(res => {
                    return expect(res).to.equal('foo');
                });
        });
    });

    context('connect()', () => {
        let Client, socket, net;

        beforeEach('create fakes', () => {
            socket = new PassThrough();
            // Faking the timeout management makes the tests a lot more simple.
            socket.setTimeout = td.function();

            Client = td.replace('../../../lib/Protocol/Client');
            net = td.replace('net');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('connects to the default endpoint when none is specified and it is available', () => {
            const con = connection();
            const start = td.replace(con, 'start');

            td.when(net.connect({ host: 'localhost', port: 33060, path: undefined })).thenDo(() => {
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            td.when(start()).thenResolve('foo');

            return con.connect()
                .then(res => {
                    return expect(res).to.equal('foo');
                });
        });

        it('creates a X Protocol client instance when the socket is established', () => {
            const con = connection();
            const start = td.replace(con, 'start');

            td.when(net.connect({ host: 'localhost', port: 33060, path: undefined })).thenDo(() => {
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            td.when(start()).thenResolve('foo');

            return con.connect()
                .then(() => {
                    expect(td.explain(Client).callCount).to.equal(1);
                    return expect(td.explain(Client).calls[0].args).to.deep.equal([socket]);
                });
        });

        it('manages a the default connection timeout until the socket is not open', () => {
            const con = connection();
            const start = td.replace(con, 'start');

            td.when(net.connect({ host: 'localhost', port: 33060, path: undefined })).thenDo(() => {
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            td.when(start()).thenResolve();

            return con.connect()
                .then(() => {
                    expect(td.explain(socket.setTimeout).callCount).to.equal(2);
                    expect(td.explain(socket.setTimeout).calls[0].args).to.deep.equal([10000]);
                    expect(td.explain(socket.setTimeout).calls[1].args).to.deep.equal([0]);
                });
        });

        it('manages a custom connection timeout until the socket is not open', () => {
            const con = connection({ connectTimeout: 500 });
            const start = td.replace(con, 'start');

            td.when(net.connect({ host: 'localhost', port: 33060, path: undefined })).thenDo(() => {
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            td.when(start()).thenResolve();

            return con.connect()
                .then(() => {
                    expect(td.explain(socket.setTimeout).callCount).to.equal(2);
                    expect(td.explain(socket.setTimeout).calls[0].args).to.deep.equal([500]);
                    expect(td.explain(socket.setTimeout).calls[1].args).to.deep.equal([0]);
                });
        });

        context('when only one endpoint is provided', () => {
            it('connects to that endpoint using its address if it is available', () => {
                const con = connection({ host: 'foo', port: 'bar' });
                const start = td.replace(con, 'start');

                td.when(net.connect({ host: 'foo', port: 'bar', path: undefined })).thenDo(() => {
                    setTimeout(() => socket.emit('ready'));
                    return socket;
                });

                td.when(start()).thenResolve('baz');

                return con.connect()
                    .then(res => {
                        return expect(res).to.equal('baz');
                    });
            });

            it('connects to that endpoint using a local Unix socket if it is available', () => {
                const con = connection({ host: 'foo', port: 'bar', socket: 'baz' });
                const start = td.replace(con, 'start');

                td.when(net.connect({ host: 'foo', port: 'bar', path: 'baz' })).thenDo(() => {
                    setTimeout(() => socket.emit('ready'));
                    return socket;
                });

                td.when(start()).thenResolve('qux');

                return con.connect()
                    .then(res => {
                        return expect(res).to.equal('qux');
                    });
            });

            it('fails when the endpoint is not available', () => {
                const con = connection({ host: 'foo' }).setClient(new Client());
                const isOpen = td.replace(con, 'isOpen');
                const hasMultipleEndpoints = td.replace(con, 'hasMultipleEndpoints');
                const hasMoreEndpointsAvailable = td.replace(con, 'hasMoreEndpointsAvailable');
                const error = new Error('foobar');

                td.when(net.connect(), { ignoreExtraArgs: true, times: 1 }).thenDo(() => {
                    setTimeout(() => {
                        socket.emit('error', error);
                        socket.emit('close', true);
                    });

                    return socket;
                });

                // The connection using the first socket should not be
                // effectively open.
                td.when(isOpen()).thenReturn(false);
                // The connection is not configured with multiple endpoints.
                td.when(hasMultipleEndpoints()).thenReturn(false);
                // So, there are no other endpoints available.
                td.when(hasMoreEndpointsAvailable()).thenReturn(false);

                return con.connect()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err).to.deep.equal(error);
                    });
            });

            it('fails with a custom error when the connection timeout is exceeded', () => {
                const connectTimeout = 500;
                const con = connection({ connectTimeout });
                const hasMultipleEndpoints = td.replace(con, 'hasMultipleEndpoints');

                td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                    setTimeout(() => socket.emit('timeout'));
                    return socket;
                });

                td.when(hasMultipleEndpoints()).thenReturn(false);

                return con.connect()
                    .catch(err => {
                        return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_CONNECTION_TIMEOUT, connectTimeout));
                    });
            });
        });

        context('when multiple endpoints are provided', () => {
            it('refurbishes a socket for connecting to the next endpoint if the connection failed to the first', () => {
                const refurbishedSocket = new PassThrough();
                // Although we do not need it, we should fake the "setTimeout"
                // method to avoid errors.
                refurbishedSocket.setTimeout = td.function();

                const con = connection({ endpoints: [{ host: 'foo', port: 'bar' }, { host: 'baz', port: 'qux' }] }).setClient(new Client());
                const start = td.replace(con, 'start');
                const isOpen = td.replace(con, 'isOpen');
                const hasMoreEndpointsAvailable = td.replace(con, 'hasMoreEndpointsAvailable');

                // The connection using the refurbished socket should be
                // effectively open.
                td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                    td.when(isOpen()).thenReturn(true);
                    setTimeout(() => refurbishedSocket.emit('ready'));
                    return refurbishedSocket;
                });

                // The connection using the first socket should not be
                // effectively open.
                td.when(net.connect(), { ignoreExtraArgs: true, times: 1 }).thenDo(() => {
                    td.when(isOpen()).thenReturn(false);
                    setTimeout(() => socket.emit('close', true));
                    return socket;
                });

                td.when(start()).thenResolve();

                // The connection will be re-created to the next endpoint, so it
                // should be available.
                td.when(hasMoreEndpointsAvailable()).thenReturn(true);

                return con.connect()
                    .then(() => {
                        expect(td.explain(net.connect).callCount).to.equal(2);
                        expect(td.explain(net.connect).calls[0].args).to.deep.equal([{ host: 'foo', port: 'bar', path: undefined }]);
                        return expect(td.explain(net.connect).calls[1].args).to.deep.equal([{ host: 'baz', port: 'qux', path: undefined }]);
                    });
            });

            it('fails when all endpoints are unavailable', () => {
                const refurbishedSocket = new PassThrough();
                // Although we do not need it, we should fake the "setTimeout"
                // method to avoid errors.
                refurbishedSocket.setTimeout = td.function();

                const con = connection({ endpoints: [{ host: 'foo', port: 'bar' }, { host: 'baz', port: 'qux' }] }).setClient(new Client());
                const isOpen = td.replace(con, 'isOpen');
                const hasMultipleEndpoints = td.replace(con, 'hasMultipleEndpoints');
                const hasMoreEndpointsAvailable = td.replace(con, 'hasMoreEndpointsAvailable');

                td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                    // The connection using the refurbished socket should be
                    // effectively open.
                    td.when(isOpen()).thenReturn(true);
                    // No more endpoints are available.
                    td.when(hasMoreEndpointsAvailable()).thenReturn(false);

                    setTimeout(() => refurbishedSocket.emit('close', true));

                    return refurbishedSocket;
                });

                td.when(net.connect(), { ignoreExtraArgs: true, times: 1 }).thenDo(() => {
                    // The connection using the first socket should not be
                    // effectively open.
                    td.when(isOpen()).thenReturn(false);
                    // There is another endpoint available.
                    td.when(hasMoreEndpointsAvailable()).thenReturn(true);

                    setTimeout(() => socket.emit('close', true));

                    return socket;
                });

                // The connection is using multi-host.
                td.when(hasMultipleEndpoints()).thenReturn(true);

                return con.connect()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED);
                    });
            });

            it('fails with a custom error when the connection timeout is exceeded', () => {
                const connectTimeout = 500;
                const con = connection({ connectTimeout });
                const hasMultipleEndpoints = td.replace(con, 'hasMultipleEndpoints');

                td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                    setTimeout(() => socket.emit('timeout'));
                    return socket;
                });

                td.when(hasMultipleEndpoints()).thenReturn(true);

                return con.connect()
                    .catch(err => {
                        return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_TIMEOUT, connectTimeout));
                    });
            });
        });

        it('fails when there is an error while creating the network socket', () => {
            const error = new Error('foobar');
            const con = connection();
            const start = td.replace(con, 'start');

            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('ready');
                    socket.emit('error', error);
                });

                return socket;
            });

            td.when(start()).thenResolve();

            return con.connect()
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('destroys the network socket and resets the state when there is a connection error', () => {
            const con = connection();
            const start = td.replace(con, 'start');
            const reset = td.replace(con, 'reset');
            const error = new Error('foobar');

            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            td.when(start()).thenReject(error);

            return con.connect()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(td.explain(reset).callCount).to.equal(1);
                    return expect(err).to.deep.equal(error);
                });
        });

        it('delegates message handling to the X Protocol client instance', () => {
            const con = connection().setClient(new Client());
            const start = td.replace(con, 'start');

            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('ready');
                    socket.emit('data', 'foo');
                    socket.emit('data', 'bar');
                });

                return socket;
            });

            td.when(start()).thenResolve();

            return con.connect()
                .then(() => {
                    expect(td.explain(Client.prototype.handleNetworkFragment).callCount).to.equal(2);
                    expect(td.explain(Client.prototype.handleNetworkFragment).calls[0].args).to.deep.equal(['foo']);
                    expect(td.explain(Client.prototype.handleNetworkFragment).calls[1].args).to.deep.equal(['bar']);
                });
        });

        it('notifies the X Protocol client instance if the network socket is abruptely closed by the server', () => {
            const con = connection().setClient(new Client());
            const isActive = td.replace(con, 'isActive');
            const isOpen = td.replace(con, 'isOpen');
            const start = td.replace(con, 'start');

            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('ready');
                    socket.emit('close');
                });

                return socket;
            });

            td.when(start()).thenResolve();
            td.when(isOpen()).thenReturn(true);
            td.when(isActive()).thenReturn(true);

            return con.connect()
                .then(() => {
                    expect(td.explain(Client.prototype.handleServerClose).callCount).to.equal(1);
                });
        });

        it('resets the connection state when it is closed by mutual agreement', () => {
            const con = connection().setClient(new Client());
            const isActive = td.replace(con, 'isActive');
            const isOpen = td.replace(con, 'isOpen');
            const reset = td.replace(con, 'reset');
            const start = td.replace(con, 'start');

            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('ready');
                    socket.emit('close');
                });

                return socket;
            });

            td.when(start()).thenResolve();
            td.when(isOpen()).thenReturn(true);
            td.when(isActive()).thenReturn(false);

            return con.connect()
                .then(() => {
                    expect(td.explain(reset).callCount).to.equal(1);
                });
        });

        it('refurbishes a socket for connecting to the same endpoint if the connection was closed by the server with a non-fatal error', () => {
            const refurbishedSocket = new PassThrough();
            // Although we do not need it, we should fake the "setTimeout"
            // method to avoid errors.
            refurbishedSocket.setTimeout = td.function();

            const con = connection({ host: 'foo', port: 'bar' }).setClient(new Client());
            // We want Connection.start() to be partly completed, so we can
            // only fake Connection.authenticate(), which is the last stage
            // in the pipeline to create a server session.
            const authenticate = td.replace(con, 'authenticate');
            const isOpen = td.replace(con, 'isOpen');
            const hasMoreEndpointsAvailable = td.replace(con, 'hasMoreEndpointsAvailable');
            // example of a non-fatal error
            const nonFatalError = new Error("Capability 'foo' doesn't exist");
            nonFatalError.info = { code: errors.ER_X_CAPABILITY_NOT_FOUND };

            // The connection using the refurbished socket should be
            // effectively open.
            td.when(net.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                td.when(isOpen()).thenReturn(true);
                setTimeout(() => refurbishedSocket.emit('ready'));
                return refurbishedSocket;
            });

            // The connection using the first socket should not be
            // effectively open.
            td.when(net.connect(), { ignoreExtraArgs: true, times: 1 }).thenDo(() => {
                td.when(isOpen()).thenReturn(false);
                setTimeout(() => socket.emit('ready'));
                return socket;
            });

            // The second call to capabilitiesSet() should resolve to an empty
            // object in order to avoid enabling TLS.
            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true }).thenResolve({});
            // The first call to capabilitiesSet() should fail with a
            // non-fatal error.
            td.when(Client.prototype.capabilitiesSet(), { ignoreExtraArgs: true, times: 1 }).thenReject(nonFatalError);
            // capabilitiesGet should always work (does not matter for this test).
            td.when(Client.prototype.capabilitiesGet()).thenResolve();

            // The client should have the up-to-date underlying network socket.
            td.when(Client.prototype.getConnection()).thenReturn(refurbishedSocket);
            td.when(Client.prototype.getConnection(), { times: 1 }).thenReturn(socket);

            // The connection will be re-created to the same endpoint, so it
            // should be available.
            td.when(hasMoreEndpointsAvailable()).thenReturn(true);
            td.when(authenticate()).thenResolve();

            return con.connect()
                .then(() => {
                    expect(td.explain(net.connect).callCount).to.equal(2);
                    expect(td.explain(net.connect).calls[0].args).to.deep.equal([{ host: 'foo', port: 'bar', path: undefined }]);
                    return expect(td.explain(net.connect).calls[1].args).to.deep.equal([{ host: 'foo', port: 'bar', path: undefined }]);
                });
        });
    });

    context('destroy()', () => {
        let Client;

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('gracefully closes the underlying X Protocol connection', () => {
            const con = connection().setClient(new Client());
            const isOpen = td.replace(con, 'isOpen');
            const destroy = td.function();

            td.when(isOpen()).thenReturn(true);
            td.when(Client.prototype.connectionClose()).thenResolve();
            td.when(Client.prototype.getConnection()).thenReturn({ destroy, destroyed: false });

            return con.destroy()
                .then(() => {
                    expect(td.explain(Client.prototype.connectionClose).callCount).to.equal(1);
                    expect(td.explain(destroy).callCount).to.equal(1);
                    // eslint-disable-next-line no-unused-expressions
                    expect(con.isClosing()).to.be.false;
                    return expect(td.explain(destroy).calls[0].args).to.be.an('array').and.be.empty;
                });
        });

        it('does nothing if the underlying connection is closed', () => {
            const con = connection().setClient(new Client());
            const isOpen = td.replace(con, 'isOpen');

            td.when(isOpen()).thenReturn(false);

            return con.destroy()
                .then(() => {
                    return expect(td.explain(Client.prototype.connectionClose).callCount).to.equal(0);
                });
        });

        it('does nothing if the network socket is destroyed', () => {
            const con = connection().setClient(new Client());
            const isOpen = td.replace(con, 'isOpen');

            td.when(isOpen()).thenReturn(true);
            td.when(Client.prototype.getConnection()).thenReturn({ destroyed: true });

            return Promise.all([con.destroy(), con.destroy()])
                .then(() => {
                    expect(td.explain(Client.prototype.connectionClose).callCount).to.equal(0);
                })
                .then(() => {
                    return con.destroy();
                })
                .then(() => {
                    return con.destroy();
                })
                .then(() => {
                    expect(td.explain(Client.prototype.connectionClose).callCount).to.equal(0);
                });
        });

        it('only closes the connection once', () => {
            const con = connection().setClient(new Client());
            const isOpen = td.replace(con, 'isOpen');
            const destroy = td.function();

            td.when(isOpen()).thenReturn(true);
            td.when(Client.prototype.connectionClose()).thenResolve();
            td.when(Client.prototype.getConnection()).thenReturn({ destroy });

            return Promise.all([con.destroy(), con.destroy()])
                .then(() => {
                    expect(td.explain(Client.prototype.connectionClose).callCount).to.equal(1);
                    return expect(td.explain(destroy).callCount).to.equal(1);
                });
        });

        it('fails if the X Protocol client instance reports an error', () => {
            const con = connection().setClient(new Client());
            const isOpen = td.replace(con, 'isOpen');
            const error = new Error('foobar');

            td.when(isOpen()).thenReturn(true);
            td.when(Client.prototype.connectionClose()).thenReject(error);
            td.when(Client.prototype.getConnection()).thenReturn({ destroyed: false });

            return con.destroy()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('enableTLS()', () => {
        let Client, secureContext, socket, tls;

        beforeEach('create fakes', () => {
            secureContext = td.function();

            socket = new PassThrough();
            // The "getProtocol()" method is specific to a TLS socket and not
            // part of the native Duplex stream API, so we need to fake it.
            socket.getProtocol = td.function();

            Client = td.replace('../../../lib/Protocol/Client');
            secureContext = td.replace('../../../lib/tls/secure-context');
            tls = td.replace('tls');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('enables TLS in the underlying connection socket', () => {
            const tlsOptions = { option: 'foo' };
            const con = connection({ tls: tlsOptions }).setClient(new Client());

            td.when(Client.prototype.getConnection()).thenReturn('bar');
            td.when(secureContext.create({ option: 'foo' })).thenReturn({ option: 'quux' });

            td.when(tls.connect({ socket: 'bar', option: 'quux' })).thenDo(() => {
                setTimeout(() => socket.emit('secureConnect'));
                return socket;
            });

            return con.enableTLS()
                .then(() => {
                    expect(td.explain(Client.prototype.setConnection).callCount).to.equal(1);
                    expect(td.explain(Client.prototype.setConnection).calls[0].args).to.deep.equal([socket]);

                    return expect(con.isSecure()).to.be.true;
                });
        });

        it('delegates message handling to the X Protocol client instance', () => {
            const con = connection().setClient(new Client());

            td.when(tls.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('secureConnect');
                    socket.emit('data', 'foo');
                    socket.emit('data', 'bar');
                });

                return socket;
            });

            return con.enableTLS()
                .then(() => {
                    expect(td.explain(Client.prototype.handleNetworkFragment).callCount).to.equal(2);
                    expect(td.explain(Client.prototype.handleNetworkFragment).calls[0].args).to.deep.equal(['foo']);
                    expect(td.explain(Client.prototype.handleNetworkFragment).calls[1].args).to.deep.equal(['bar']);
                });
        });

        it('tracks all errors generated while enabling TLS', () => {
            const error = new Error('foobar');
            const con = connection().setClient(new Client());

            td.when(tls.connect(), { ignoreExtraArgs: true }).thenDo(() => {
                setTimeout(() => {
                    socket.emit('secureConnect');
                    socket.emit('error', error);
                });

                return socket;
            });

            return con.enableTLS()
                .then(() => {
                    return expect(con.getError()).to.deep.equal(error);
                });
        });
    });

    context('isActive()', () => {
        let Client;

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('checks whether the connection is in the middle of a workload', () => {
            const con = connection();
            // eslint-disable-next-line no-unused-expressions
            expect(con.isActive()).to.be.false;

            con.setClient(new Client());

            td.when(Client.prototype.isRunning()).thenReturn(false);
            // eslint-disable-next-line no-unused-expressions
            expect(con.isActive()).to.be.false;

            td.when(Client.prototype.isRunning()).thenReturn(true);
            // eslint-disable-next-line no-unused-expressions
            expect(con.isActive()).to.be.true;
        });
    });

    context('isFromPool()', () => {
        it('always returns false for standalone connections because they are not from a connection pool', () => {
            return expect(connection().isFromPool()).to.be.false;
        });
    });

    context('isIdle()', () => {
        it('always returns false for standalone connection because they are never idle on the client side', () => {
            return expect(connection().isIdle()).to.be.false;
        });
    });

    context('hasMultipleEndpoints()', () => {
        it('checks wether a connection works in a multi-host setting', () => {
            /* eslint-disable no-unused-expressions */
            expect(connection().hasMultipleEndpoints()).to.be.false;
            expect(connection({ endpoints: ['foo'] }).hasMultipleEndpoints()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(connection({ endpoints: ['foo', 'bar'] }).hasMultipleEndpoints()).to.be.true;
        });
    });

    context('getAuth()', () => {
        it('returns the default authentication mechanism for secure channels', () => {
            expect(connection({ socket: '/path/to/local/file.sock' }).getAuth()).to.equal('PLAIN');
            expect(connection({ endpoints: [{ socket: '/path/to/local/file.sock' }] }).getAuth()).to.equal('PLAIN');
            // TODO(Rui): "ssl" is deprecated.
            expect(connection({ ssl: true }).getAuth()).to.equal('PLAIN');
            expect(connection({ tls: { enabled: true } }).getAuth()).to.equal('PLAIN');
            expect(connection({ tls: { enabled: true }, ssl: false }).getAuth()).to.equal('PLAIN');
            expect(connection({ socket: '/path/to/local/file.sock', ssl: false }).getAuth()).to.equal('PLAIN');
            expect(connection({ socket: '/path/to/local/file.sock', tls: { enabled: false } }).getAuth()).to.equal('PLAIN');
            expect(connection({ socket: '/path/to/local/file.sock', ssl: false, tls: { enabled: false } }).getAuth()).to.equal('PLAIN');
        });

        it('returns the default authentication mechanism for insecure channels', () => {
            // TODO(Rui): "ssl" is deprecated.
            expect(connection({ ssl: false }).getAuth()).to.equal('MYSQL41');
            expect(connection({ tls: { enabled: false } }).getAuth()).to.equal('MYSQL41');
            return expect(connection({ ssl: true, tls: { enabled: false } }).getAuth()).to.equal('MYSQL41');
        });

        it('returns a custom authentication mechanism if one is defined', () => {
            expect(connection({ auth: 'foo' }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', ssl: false }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', tls: { enabled: false } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', ssl: true }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', tls: { enabled: true } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', ssl: true, tls: { enabled: true } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', ssl: false }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', tls: { enabled: false } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', ssl: true }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', tls: { enabled: true } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', ssl: false, tls: { enabled: false } }).getAuth()).to.equal('foo');
            expect(connection({ auth: 'foo', socket: '/path/to/local/file.sock', ssl: true, tls: { enabled: true } }).getAuth()).to.equal('foo');
        });
    });

    context('getServerHostname()', () => {
        it('retrieves the hostname of the target endpoint', () => {
            let con = connection();
            expect(con.getServerHostname()).to.equal('localhost');

            con = connection({ socket: 'foo' });
            // For local Unix socket connections, we want it to be undefined.
            // eslint-disable-next-line no-unused-expressions
            expect(con.getServerHostname()).to.not.exist;

            con = connection({ host: 'foo' });
            expect(con.getServerHostname()).to.equal('foo');

            con = connection({ endpoints: [{ host: 'foo' }, { host: 'bar' }] });
            return expect(con.getServerHostname()).to.equal('foo');
        });
    });

    context('getServerPort()', () => {
        it('retrieves the target port used to connect to the MySQL endpoint', () => {
            let con = connection();
            expect(con.getServerPort()).to.equal(33060);

            con = connection({ socket: 'foo' });
            // For local Unix socket connections, we want it to be undefined.
            // eslint-disable-next-line no-unused-expressions
            expect(con.getServerPort()).to.not.exist;

            con = connection({ port: 'foo' });
            expect(con.getServerPort()).to.equal('foo');

            con = connection({ endpoints: [{ port: 'foo' }, { port: 'bar' }] });
            return expect(con.getServerPort()).to.equal('foo');
        });
    });

    context('getServerSocketPath()', () => {
        it('retrieves the path of the local Unix socket file used to connection to the MySQL endpoint', () => {
            let con = connection({ socket: 'foo' });
            expect(con.getServerSocketPath()).to.equal('foo');

            con = connection({ endpoints: [{ socket: 'foo' }, { socket: 'bar' }] });
            return expect(con.getServerSocketPath()).to.equal('foo');
        });
    });

    context('getSchemaName()', () => {
        it('retrieves the name of the default schema associated with the current connection', () => {
            return expect(connection({ schema: 'foo' }).getSchemaName()).to.equal('foo');
        });
    });

    context('getUser()', () => {
        it('retrieves the name of the user of the MySQL account used to authenticate the current connection', () => {
            let con = connection();
            expect(con.getUser()).to.equal('');

            con = connection({ user: 'foo' });
            expect(con.getUser()).to.equal('foo');

            con = connection({ dbUser: 'foo' });
            expect(con.getUser()).to.equal('foo');

            con = connection({ dbUser: 'foo', user: 'bar' });
            return expect(con.getUser()).to.equal('bar');
        });
    });

    context('hasCustomAuthenticationMechanism()', () => {
        it('checks if the connection is using a custom authentication mechanism', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(connection().hasCustomAuthenticationMechanism()).to.be.false;
            return expect(connection({ auth: 'foo' }).hasCustomAuthenticationMechanism()).to.be.true;
        });
    });

    context('hasMoreEndpointsAvailable()', () => {
        it('checks if the connection can be made to other MySQL endpoints', () => {
            let con = connection();
            let update = td.replace(con, 'update');

            // eslint-disable-next-line no-unused-expressions
            expect(con.hasMoreEndpointsAvailable()).to.be.true;

            con = connection({ endpoints: ['foo', 'bar'] });
            update = td.replace(con, 'update');

            // eslint-disable-next-line no-unused-expressions
            expect(con.hasMoreEndpointsAvailable()).to.be.true;
            return expect(td.explain(update).callCount).to.equal(1);
        });
    });

    context('open()', () => {
        let multiHost, srv;

        beforeEach('create fakes', () => {
            multiHost = td.replace('../../../lib/topology/multi-host');
            srv = td.replace('../../../lib/topology/dns-srv');

            connection = require('../../../lib/DevAPI/Connection');
        });

        context('when DNS SRV is not enabled', () => {
            it('creates a connection to the endpoint specified by the connection options', () => {
                const con = connection({ host: 'foo' });
                const connect = td.replace(con, 'connect');
                const update = td.replace(con, 'update');

                td.when(connect()).thenResolve('bar');

                return con.open()
                    .then(res => {
                        expect(td.explain(update).callCount).to.equal(1);
                        expect(res).to.equal('bar');
                        expect(td.explain(multiHost.sort).callCount).to.equal(1);
                        return expect(td.explain(multiHost.sort).calls[0].args).to.deep.equal([[{ host: 'foo', port: 33060, socket: undefined }]]);
                    });
            });

            it('creates a connection to the most appropriate endpoint in a list specified by the connection options', () => {
                const endpoints = [{ host: 'foo' }, { host: 'bar' }];
                const con = connection({ endpoints });
                const connect = td.replace(con, 'connect');
                const update = td.replace(con, 'update');

                td.when(connect()).thenResolve('baz');

                return con.open()
                    .then(res => {
                        expect(td.explain(update).callCount).to.equal(1);
                        expect(res).to.equal('baz');
                        expect(td.explain(multiHost.sort).callCount).to.equal(1);
                        return expect(td.explain(multiHost.sort).calls[0].args).to.deep.equal([endpoints]);
                    });
            });

            it('fails when an error is reported while connecting to the endpoint', () => {
                const con = connection({ host: 'foo' });
                const connect = td.replace(con, 'connect');
                const error = new Error('foobar');

                td.when(connect()).thenReject(error);

                return con.open()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err).to.deep.equal(error);
                    });
            });
        });

        context('when DNS SRV is enabled', () => {
            it('creates a connection to the most appropriate endpoint associated to a given DNS SRV registry', () => {
                const con = connection({ host: 'foo', resolveSrv: true });
                const connect = td.replace(con, 'connect');
                const update = td.replace(con, 'update');

                td.when(srv.lookup('foo')).thenResolve([{ host: 'bar' }, { host: 'baz' }]);
                td.when(connect()).thenResolve('qux');

                return con.open()
                    .then(res => {
                        expect(td.explain(update).callCount).to.equal(1);
                        expect(res).to.equal('qux');
                        expect(td.explain(srv.sort).callCount).to.equal(1);
                        return expect(td.explain(srv.sort).calls[0].args).to.deep.equal([[{ host: 'bar' }, { host: 'baz' }]]);
                    });
            });

            it('fails when an error is reported while checking the DNS SRV records', () => {
                const con = connection({ host: 'foo', resolveSrv: true });
                const error = new Error('foobar');

                td.when(srv.lookup('foo')).thenReject(error);

                return con.open()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err).to.deep.equal(error);
                    });
            });

            it('fails when an error is reported while connecting to the endpoint', () => {
                const con = connection({ host: 'foo', resolveSrv: true });
                const connect = td.replace(con, 'connect');
                const error = new Error('foobar');

                td.when(srv.lookup(), { ignoreExtraArgs: true }).thenResolve();
                td.when(connect()).thenReject(error);

                return con.open()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err).to.deep.equal(error);
                    });
            });
        });
    });

    context('override()', () => {
        let Client;

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('resets and re-uses the underlying X Protocol connection', () => {
            const con = connection().setClient(new Client());

            td.when(Client.prototype.sessionReset()).thenResolve();

            return con.override()
                .then(res => {
                    expect(res).to.deep.equal(con);
                    return expect(td.explain(Client.prototype.sessionReset).callCount).to.equal(1);
                });
        });

        it('fails if the X Protocol client instance reports an error', () => {
            const error = new Error('foobar');

            td.when(Client.prototype.sessionReset()).thenReject(error);

            return connection().setClient(new Client()).override()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('start()', () => {
        it('executes the pipeline for creating a server-side X Protocol session using TLS', () => {
            const con = connection();
            const capabilitiesSet = td.replace(con, 'capabilitiesSet');
            const enableTLS = td.replace(con, 'enableTLS');
            const capabilitiesGet = td.replace(con, 'capabilitiesGet');
            const addCapabilities = td.replace(con, 'addCapabilities');
            const authenticate = td.replace(con, 'authenticate');

            td.when(capabilitiesSet()).thenResolve({ tls: true });
            td.when(enableTLS()).thenResolve();
            td.when(capabilitiesGet()).thenResolve('foo');
            td.when(addCapabilities('foo')).thenReturn();
            td.when(authenticate()).thenResolve('bar');

            return con.start()
                .then(res => {
                    return expect(res).to.equal('bar');
                });
        });

        it('executes the pipeline for creating a server-side X Protocol session without TLS', () => {
            const con = connection();
            const capabilitiesSet = td.replace(con, 'capabilitiesSet');
            const capabilitiesGet = td.replace(con, 'capabilitiesGet');
            const addCapabilities = td.replace(con, 'addCapabilities');
            const authenticate = td.replace(con, 'authenticate');

            td.when(capabilitiesSet()).thenResolve({ tls: false });
            td.when(capabilitiesGet()).thenResolve('foo');
            td.when(addCapabilities('foo')).thenReturn();
            td.when(authenticate()).thenResolve('bar');

            return con.start()
                .then(res => {
                    return expect(res).to.equal('bar');
                });
        });
    });

    context('Connection.validate()', () => {
        let logger, secureContext, srv;

        beforeEach('create fakes', () => {
            logger = td.replace('../../../lib/logger');
            secureContext = td.replace('../../../lib/tls/secure-context');
            srv = td.replace('../../../lib/topology/dns-srv');

            connection = require('../../../lib/DevAPI/Connection');
        });

        it('generates a deprecation warning for each deprecated property', () => {
            const options = { dbPassword: 'foo', dbUser: 'bar', ssl: 'baz', sslOptions: 'qux' };
            const warning = td.function();

            td.when(logger('connection:options')).thenReturn({ warning });

            connection.validate(options);

            expect(td.explain(warning).callCount).to.equal(4);
            expect(td.explain(warning).calls[0].args).to.deep.equal(['dbPassword', warnings.MESSAGES.WARN_DEPRECATED_DB_PASSWORD, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
            expect(td.explain(warning).calls[1].args).to.deep.equal(['dbUser', warnings.MESSAGES.WARN_DEPRECATED_DB_USER, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
            expect(td.explain(warning).calls[2].args).to.deep.equal(['ssl', warnings.MESSAGES.WARN_DEPRECATED_SSL_OPTION, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
            expect(td.explain(warning).calls[3].args).to.deep.equal(['sslOptions', warnings.MESSAGES.WARN_DEPRECATED_SSL_ADDITIONAL_OPTIONS, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });

        it('fails if some TLS option is badly specified', () => {
            const tlsOptions = { tls: 'foo', ssl: 'bar', sslOptions: 'baz' };
            const error = new Error('foobar');
            const warning = td.function();

            td.when(logger('connection:options')).thenReturn({ warning });
            td.when(secureContext.validate(tlsOptions)).thenThrow(error);

            return expect(() => connection.validate(tlsOptions)).to.throw(error);
        });

        it('fails if the connection timeout is badly specified', () => {
            expect(() => connection.validate({ connectTimeout: -1 })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
            expect(() => connection.validate({ connectTimeout: 'foo' })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
            expect(() => connection.validate({ connectTimeout: false })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
            expect(() => connection.validate({ connectTimeout: [] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
            return expect(() => connection.validate({ connectTimeout: {} })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
        });

        it('fails if the connection attributes are badly specified', () => {
            expect(() => connection.validate({ connectionAttributes: -1 })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
            expect(() => connection.validate({ connectionAttributes: 'foo' })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
            expect(() => connection.validate({ connectionAttributes: null })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
            return expect(() => connection.validate({ connectionAttributes: [] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
        });

        it('fails if a connection attribute name starts with "_"', () => {
            return expect(() => connection.validate({ connectionAttributes: { _foo: 'bar' } })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
        });

        it('fails if the SRV setup is badly specified', () => {
            const srvOptions = { resolveSrv: 'foo', endpoints: ['bar'], host: 'baz', port: 'qux', socket: 'quux' };
            const error = new Error('foobar');

            td.when(srv.validate(srvOptions)).thenThrow(error);

            return expect(() => connection.validate(srvOptions)).to.throw(error);
        });

        it('fails if the port is not in the valid range', () => {
            expect(() => connection.validate({ port: 'foo' })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
            expect(() => connection.validate({ port: -1 })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
            expect(() => connection.validate({ port: 65537 })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);

            expect(() => connection.validate({ endpoints: [{ port: 8080 }, { port: 'foo' }] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
            expect(() => connection.validate({ endpoints: [{ port: 8080 }, { port: -1 }] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
            return expect(() => connection.validate({ endpoints: [{ port: 8080 }, { port: 65537 }] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
        });
    });
});
