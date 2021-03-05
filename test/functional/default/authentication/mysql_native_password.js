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

const config = require('../../../config');
const crypto = require('crypto');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');
const path = require('path');

describe('mysql_native_password authentication plugin', () => {
    const user = 'user';
    const password = 'password';
    const plugin = 'mysql_native_password';

    beforeEach('create user with mysql_native_password plugin', () => {
        return fixtures.createUser({ user, plugin, password });
    });

    beforeEach('invalidate the server authentication cache', () => {
        return fixtures.resetAuthenticationCache();
    });

    afterEach('delete the user created for a given test', () => {
        return fixtures.dropUser({ user });
    });

    after('delete any dangling user created for tests that have been skipped', () => {
        return fixtures.dropUser({ user });
    });

    context('connecting without an authentication mechanism', () => {
        context('over TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            it('succeeds with a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { password, user });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('succeeds with a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('over regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            it('succeeds with a configuration object', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { password, user });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('MYSQL41');
                        return session.close();
                    });
            });

            it('succeeds with a URI', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('MYSQL41');
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('over a Unix socket', () => {
            const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

            it('succeeds with a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('succeeds with a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });
    });

    context('connecting with the MYSQL41 authentication mechanism', () => {
        const auth = 'MYSQL41';

        context('over TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            it('succeeds with a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds with a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('over regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            it('succeeds with a configuration object', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds with a URI', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('over a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

            it('succeeds with a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds with a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('when debug mode is enabled', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'auth.js');

            it('logs the appropriate authentication mechanism', () => {
                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.AuthenticateStart', script, [user, password, auth])
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        expect(proc.logs[0]).to.contain.keys('mech_name', 'auth_data');
                        expect(proc.logs[0].mech_name).to.equal(auth);
                        expect(proc.logs[0].auth_data).to.contain.keys('type', 'data');
                    });
            });

            it('logs the appropriate authentication data', () => {
                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.AuthenticateContinue', script, [user, password, auth])
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        expect(proc.logs[0]).to.contain.keys('auth_data');
                        expect(proc.logs[0].auth_data).to.contain.keys('type', 'data');
                        expect(Buffer.from(proc.logs[0].auth_data.data).toString()).to.have.string(user);
                    });
            });
        });
    });

    context('connecting with the PLAIN authentication mechanism', () => {
        const auth = 'PLAIN';

        context('over TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            it('succeeds with a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds with a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, tlsConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });

        context('over regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            it('fails with a configuration object', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_NOT_SUPPORTED_AUTH_MODE);
                    });
            });

            it('fails with a URI', () => {
                const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_NOT_SUPPORTED_AUTH_MODE);
                    });
            });
        });

        context('over a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

            it('succeeds with a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds with a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });

            it('fails when a wrong password is provided using a URI', function () {
                const authConfig = Object.assign({}, config, socketConfig, { auth, user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    });
            });
        });
    });

    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        context('without a password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tlsConfig = { socket: undefined, tls: { enabled: true } };

                it('fails with a configuration object', () => {
                    const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });

                it('fails with a URI', () => {
                    const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { socket: undefined, tls: { enabled: false } };

                it('fails with a configuration object', () => {
                    const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });

                it('fails with a URI', () => {
                    const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

                it('fails with a configuration object', function () {
                    const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });

                it('fails with a URI', function () {
                    const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        });
                });
            });
        });

        context('with the password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tlsConfig = { socket: undefined, tls: { enabled: true } };

                beforeEach('save the password in the server authentication cache', () => {
                    return fixtures.savePasswordInAuthenticationCache({ user, password });
                });

                it('succeeds with a configuration object', () => {
                    const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds with a URI', () => {
                    const authConfig = Object.assign({}, config, tlsConfig, { auth, password, user });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { socket: undefined, tls: { enabled: false } };

                beforeEach('save the password in the server authentication cache', () => {
                    return fixtures.savePasswordInAuthenticationCache({ user, password });
                });

                it('succeeds with a configuration object', () => {
                    const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds with a URI', () => {
                    const authConfig = Object.assign({}, config, tcpConfig, { auth, password, user });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

                beforeEach('save the password in the server authentication cache', function () {
                    if (!config.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.savePasswordInAuthenticationCache({ user, password });
                });

                it('succeeds with a configuration object', function () {
                    const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds with a URI', function () {
                    const authConfig = Object.assign({}, config, socketConfig, { auth, password, user });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });
        });
    });
});
