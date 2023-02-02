/*
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
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
const mysqlx = require('../../../..');
const os = require('os');
const path = require('path');

describe('connecting to a server without support for TLS', () => {
    // container as defined in docker-compose.yml
    const baseConfig = { host: 'mysql-tls-disabled', schema: undefined };
    const socket = path.join(os.tmpdir(), `${baseConfig.host}.sock`);

    context('with a connection configuration object', () => {
        it('fails when TLS is implicitly enabled in the client', async () => {
            const tcpConfig = { ...config, ...baseConfig, socket: undefined };

            let session;

            try {
                session = await mysqlx.getSession(tcpConfig);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
            } finally {
                await session?.close();
            }
        });

        it('fails when TLS is explicitly enabled in the client', async () => {
            const tlsConfig = { ...config, ...baseConfig, socket: undefined, tls: { enabled: true } };

            let session;

            try {
                session = await mysqlx.getSession(tlsConfig);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
            } finally {
                await session?.close();
            }
        });

        context('when TLS is disabled in the client', () => {
            // The password must be stored in the server authentication cache
            // beforehand, and it is not possible to use the PLAIN
            // authentication mechanism on top of TLS because the sever does
            // not support TLS. So, saving the password in the server
            // authentication cache is possible using a Unix socket.
            beforeEach('ensure the password is stored in the server authentication cache', async () => {
                const connectionConfig = { ...config, ...baseConfig, socket };

                await fixtures.savePasswordInAuthenticationCache({ connectionConfig });
            });

            context('in the absence of additional TLS-related options', () => {
                it('succeeds without TLS', async () => {
                    const tcpConfig = { ...config, ...baseConfig, socket, tls: { enabled: false } };

                    const session = await mysqlx.getSession(tcpConfig);
                    expect(session.inspect()).to.have.property('tls', false);
                    await session?.close();
                });
            });

            context('in the presence of additional TLS-related options', () => {
                it('succeeds without TLS', async () => {
                    const tcpConfig = { ...config, ...baseConfig, socket, tls: { enabled: false, ca: '/any/path/to/ca.pem' } };

                    const session = await mysqlx.getSession(tcpConfig);
                    expect(session.inspect()).to.have.property('tls', false);
                    await session?.close();
                });
            });
        });
    });

    context('with a connection string', () => {
        it('fails when TLS is implicitly enabled in the client', async () => {
            const tcpConfig = { ...config, ...baseConfig, socket: undefined };
            const uri = `mysqlx://${tcpConfig.user}:${tcpConfig.password}@${tcpConfig.host}:${tcpConfig.port}`;

            let session;

            try {
                session = await mysqlx.getSession(uri);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
            } finally {
                await session?.close();
            }
        });

        it('fails when TLS is explicitly enabled in the client', async () => {
            const tlsConfig = { ...config, ...baseConfig, tls: { enabled: true } };
            const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?ssl-mode=REQUIRED`;

            let session;

            try {
                session = await mysqlx.getSession(uri);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
            } finally {
                await session?.close();
            }
        });

        context('when TLS is disabled in the client', () => {
            // The password must be stored in the server authentication cache
            // beforehand, and it is not possible to use the PLAIN
            // authentication mechanism on top of TLS because the sever does
            // not support TLS. So, saving the password in the server
            // authentication cache is possible using a Unix socket.
            beforeEach('ensure the password is stored in the server authentication cache', async () => {
                const connectionConfig = { ...config, ...baseConfig, socket };

                await fixtures.savePasswordInAuthenticationCache({ connectionConfig });
            });

            context('in the absence of additional TLS-related options', () => {
                it('succeeds when TLS is disabled in the client', async () => {
                    const socketConfig = { ...config, ...baseConfig, socket, tls: { enabled: false } };
                    const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=DISABLED`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect()).to.have.property('tls', false);
                    await session?.close();
                });
            });

            context('in the presence of additional TLS-related options', () => {
                it('succeeds when TLS is disabled in the client', async () => {
                    const socketConfig = { ...config, ...baseConfig, socket, tls: { ca: '/any/path/to/ca.pem', enabled: false } };
                    const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=DISABLED&ssl-ca=${socketConfig.tls.ca}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect()).to.have.property('tls', false);
                    await session?.close();
                });
            });
        });
    });
});
