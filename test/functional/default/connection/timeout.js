/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const net = require('net');
const os = require('os');
const path = require('path');

describe('connecting to servers with a given timeout', () => {
    context('when the timeout value is not valid', () => {
        const baseConfig = { schema: undefined, socket: undefined };

        it('fails to connect with a configuration object', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });

            return mysqlx.getSession(timeoutConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                });
        });

        it('fails to connect with a connection string', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });
            const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@(${timeoutConfig.socket})?connect-timeout=${timeoutConfig.connectTimeout}`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                });
        });
    });

    context('when the timeout is not exceeded', () => {
        const baseConfig = { schema: undefined, socket: undefined };

        it('disables the timeout for subsequent activity', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100 });

            return mysqlx.getSession(timeoutConfig)
                .then(session => {
                    return new Promise(resolve => setTimeout(() => resolve(session), timeoutConfig.connectTimeout * 2))
                        .then(() => session.sql('SELECT 1'))
                        .then(() => session.close());
                });
        });
    });

    context('when there is only one target endpoint', () => {
        // The dummy TCP server is created in the host where the tests are running.
        const baseConfig = { host: 'localhost', schema: undefined, socket: undefined };

        let server;

        beforeEach('create fake server', () => {
            server = net.createServer();
        });

        afterEach('close fake server', () => {
            return fixtures.destroyServerSocket(server);
        });

        context('using a Unix socket', () => {
            const socket = path.join(os.tmpdir(), 'dummy.sock');

            beforeEach('start fake server', function (done) {
                if (os.platform() === 'win32') {
                    return this.skip();
                }

                server.listen(socket, done).on('error', done);
            });

            context('when the timeout is exceeded', () => {
                it('fails to connect with a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, socket });
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails to connect with a connection string', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, socket });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@(${timeoutConfig.socket})?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });

            context('when the timeout is not exceeded', function () {
                // assuming a default value of 10s for the "mocha" timeout
                // 2s should be enough to ensure the test is actually waiting
                const connectTimeout = this.timeout() / 5;

                it('waits until the server is available with a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, socket });
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(timeoutConfig), testChecker])
                        .then(res => expect(res).to.be.true);
                });

                it('waits until the server is available with a connection string', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, socket });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@(${timeoutConfig.socket})?connect-timeout=${timeoutConfig.connectTimeout}`;
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(uri), testChecker])
                        .then(res => expect(res).to.be.true);
                });
            });
        });

        context('using TCP', () => {
            let port;

            beforeEach('start fake server', done => {
                server.listen(0, () => {
                    port = server.address().port;
                    return done();
                });
            });

            context('when the timeout is exceeded', () => {
                it('fails to connect with a configuration object', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, port });
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails to connect with a connection string', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, port });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@${timeoutConfig.host}:${timeoutConfig.port}?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });

            context('when the timeout is not exceeded', function () {
                // assuming a default value of 10s for the "mocha" timeout
                // 2s should be enough to ensure the test is actually waiting
                const connectTimeout = this.timeout() / 5;

                it('waits until the server is available with a configuration object', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, port });
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(timeoutConfig), testChecker])
                        .then(res => expect(res).to.be.true);
                });

                it('waits until the server is available with a connection string', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, port });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@${timeoutConfig.host}:${timeoutConfig.port}?connect-timeout=${timeoutConfig.connectTimeout}`;
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(uri), testChecker])
                        .then(res => expect(res).to.be.true);
                });
            });
        });
    });

    context('when there are multiple target hosts', () => {
        // The dummy TCP server is created in the host where the tests are running.
        const baseConfig = { host: 'localhost', schema: undefined, socket: undefined };

        let primary, secondary;

        beforeEach('create fake servers', () => {
            primary = net.createServer();
            secondary = net.createServer();
        });

        afterEach('close fake servers', () => {
            return Promise.all([fixtures.destroyServerSocket(primary), fixtures.destroyServerSocket(secondary)]);
        });

        context('using a Unix socket', () => {
            const primarysocket = path.join(os.tmpdir(), 'dummy-primary.sock');
            const secondarySocket = path.join(os.tmpdir(), 'dummy-secondary.sock');

            beforeEach('start fake server', function (done) {
                if (os.platform() === 'win32') {
                    return this.skip();
                }

                primary.listen(primarysocket, () => secondary.listen(secondarySocket, done));
            });

            context('when the timeout is exceeded', () => {
                it('fails to connect with a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const connectTimeout = 100;
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;
                    // Track test start time.
                    const beforeTest = Date.now();

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            const elapsedTime = Date.now() - beforeTest;
                            // The timeout check restarts for each endpoint.
                            expect(elapsedTime).to.be.at.least(connectTimeout * timeoutConfig.endpoints.length);
                            return expect(err.message).to.equal(error);
                        });
                });

                it('fails to connect with a connection string', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const connectTimeout = 100;
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => encodeURIComponent(e.socket)).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;
                    // Track test start time.
                    const beforeTest = Date.now();

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            const elapsedTime = Date.now() - beforeTest;
                            // The timeout check restarts for each endpoint.
                            expect(elapsedTime).to.be.at.least(connectTimeout * timeoutConfig.endpoints.length);
                            return expect(err.message).to.equal(error);
                        });
                });
            });

            context('when the timeout is not exceeded', function () {
                // assuming a default value of 10s for the "mocha" timeout
                // 2s should be enough to ensure the test is actually waiting
                const connectTimeout = this.timeout() / 5;

                it('waits until the server is available with a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(timeoutConfig), testChecker])
                        .then(res => expect(res).to.be.true);
                });

                it('waits until the server is available with a connection string', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => encodeURIComponent(e.socket)).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(uri), testChecker])
                        .then(res => expect(res).to.be.true);
                });
            });
        });

        context('using TCP', () => {
            let primaryPort, secondaryPort;

            beforeEach('start fake server', done => {
                primary.listen(0, () => {
                    primaryPort = primary.address().port;
                    secondary.listen(0, () => {
                        secondaryPort = secondary.address().port;
                        return done();
                    });
                });
            });

            context('when the timeout is exceeded', () => {
                it('fails to connect with a configuration object', () => {
                    const connectTimeout = 100;
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ port: primaryPort }, { port: secondaryPort }] });
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;
                    // Track test start time.
                    const beforeTest = Date.now();

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            const elapsedTime = Date.now() - beforeTest;
                            // The timeout check restarts for each endpoint.
                            expect(elapsedTime).to.be.at.least(connectTimeout * timeoutConfig.endpoints.length);
                            return expect(err.message).to.equal(error);
                        });
                });

                it('fails to connect with a connection string', () => {
                    const connectTimeout = 100;
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ host: baseConfig.host, port: primaryPort }, { host: baseConfig.host, port: secondaryPort }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => `${e.host}:${e.port}`).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;
                    // Track test start time.
                    const beforeTest = Date.now();

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            const elapsedTime = Date.now() - beforeTest;
                            // The timeout check restarts for each endpoint.
                            expect(elapsedTime).to.be.at.least(connectTimeout * timeoutConfig.endpoints.length);
                            return expect(err.message).to.equal(error);
                        });
                });
            });

            context('when the timeout is not exceeded', function () {
                // assuming a default value of 10s for the "mocha" timeout
                // 2s should be enough to ensure the test is actually waiting
                const connectTimeout = this.timeout() / 5;

                it('waits until the server is available with a configuration object', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ port: primaryPort }, { port: secondaryPort }] });
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(timeoutConfig), testChecker])
                        .then(res => expect(res).to.be.true);
                });

                it('waits until the server is available with a connection string', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout, endpoints: [{ host: baseConfig.host, port: primaryPort }, { host: baseConfig.host, port: secondaryPort }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => `${e.host}:${e.port}`).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    // the test should exit before the timeout kicks in
                    const testChecker = new Promise(resolve => setTimeout(() => resolve(true), connectTimeout - 100));

                    return Promise.race([mysqlx.getSession(uri), testChecker])
                        .then(res => expect(res).to.be.true);
                });
            });
        });
    });
});
