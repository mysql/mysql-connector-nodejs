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

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const mysqlx = require('../../../..');
const os = require('os');

describe('connecting to a server without support for TLS', () => {
    // container as defined in docker-compose.yml
    const baseConfig = { host: 'mysql-with-ssl-disabled', schema: undefined };

    context('with a connection configuration object', () => {
        const tcpConfig = Object.assign({}, config, baseConfig, { socket: undefined });

        it('fails when TLS is implicitly enabled in the client', () => {
            return mysqlx.getSession(tcpConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
                });
        });

        it('fails when TLS is explicitly enabled in the client', () => {
            const tlsConfig = Object.assign({}, tcpConfig, { tls: { enabled: true } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
                });
        });

        // The following tests only run on Unix platforms because they
        // require an initial connection via Unix socket to save the
        // password in the authentication cache. This is the only alternative
        // because the server does not support TLS.
        // In the end, TLS is never supposed to be used with a Unix Socket.
        context('when TLS is disabled in the client', () => {
            beforeEach('save password in the server cache', function () {
                const socketConfig = Object.assign({}, config, baseConfig);

                if (!socketConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(socketConfig)
                    .then(session => {
                        return session.close();
                    });
            });

            context('in the absence of additional TLS-related options', () => {
                it('succeeds without TLS', function () {
                    const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false } });

                    if (!tlsConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(tlsConfig)
                        .then(session => {
                            return session.close();
                        });
                });
            });

            context('in the presence of additional TLS-related options', () => {
                it('succeeds without TLS', function () {
                    const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false, ca: '/any/path/to/ca.pem' } });

                    if (!tlsConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(tlsConfig)
                        .then(session => {
                            return session.close();
                        });
                });
            });
        });
    });

    context('with a connection string', () => {
        const tcpConfig = Object.assign({}, config, baseConfig, { socket: undefined });

        it('fails when TLS is implicitly enabled in the client', () => {
            const uri = `mysqlx://${tcpConfig.user}:${tcpConfig.password}@${tcpConfig.host}:${tcpConfig.port}`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
                });
        });

        it('fails when TLS is explicitly enabled in the client', () => {
            const tlsConfig = Object.assign({}, config, tcpConfig, { tls: { enabled: true } });
            const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?ssl-mode=REQUIRED`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS);
                });
        });

        // The following tests only run on Unix platforms because they
        // require an initial connection via Unix socket to save the
        // password in the authentication cache. This is the only alternative
        // because the server does not support TLS.
        // In the end, TLS is never supposed to be used with a Unix Socket.
        context('when TLS is disabled in the client', () => {
            beforeEach('save password in the server cache', function () {
                const socketConfig = Object.assign({}, config, baseConfig);

                if (!socketConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.close();
                    });
            });

            context('in the absence of additional TLS-related options', () => {
                it('succeeds when TLS is disabled in the client', function () {
                    const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false } });

                    if (!tlsConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@(${tlsConfig.socket})?ssl-mode=DISABLED`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            return session.close();
                        });
                });
            });

            context('in the presence of additional TLS-related options', () => {
                it('succeeds when TLS is disabled in the client', () => {
                    const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/any/path/to/ca.pem', enabled: false } });

                    if (!tlsConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@(${tlsConfig.socket})?ssl-mode=DISABLED&ssl-ca=${tlsConfig.tls.ca}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            return session.close();
                        });
                });
            });
        });
    });
});
