/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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

describe('mysql_native_password authentication plugin', () => {
    const user = 'user';
    const password = 'password';
    const plugin = 'mysql_native_password';

    context('connecting over TCP', () => {
        const connectionConfig = { socket: undefined, tls: { enabled: false } };

        beforeEach('create user with mysql_native_password plugin', () => {
            return fixtures.createUser({ connectionConfig, password, plugin, user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache({ connectionConfig });
        });

        afterEach('delete the user created for a given test', () => {
            return fixtures.dropUser({ connectionConfig, user });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            return fixtures.dropUser({ connectionConfig, user });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when no authentication mechanism is selected', () => {
            context('using a connection configuration object', () => {
                it('connects with the right password using the MYSQL41 authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_AUTH_MORE_INFO);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password using the MYSQL41 authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_AUTH_MORE_INFO);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the PLAIN authentication mechanism is selected', () => {
            const auth = 'PLAIN';

            context('using a connection configuration object', () => {
                it('always fails to connect', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_NOT_SUPPORTED_AUTH_MODE);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('always fails to connect', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_NOT_SUPPORTED_AUTH_MODE);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the MYSQL41 authentication mechanism is selected', () => {
            const auth = 'MYSQL41';

            context('using a connection configuration object', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('when the SHA256_MEMORY authentication mechanism is selected', () => {
            const auth = 'SHA256_MEMORY';

            context('and the server authentication cache does not contain the password', () => {
                context('using a connection configuration object', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });

            context('and the server authentication cache already contains the password', () => {
                beforeEach('ensure the password is stored in the server authentication cache', async () => {
                    await fixtures.savePasswordInAuthenticationCache({ connectionConfig, password, user });
                });

                context('using a connection configuration object', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        const session = await mysqlx.getSession(authConfig);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });

                    it('fails to connect with the wrong password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });

                    it('fails to connect with the wrong password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });
        });
    });

    context('connecting over TCP and TLS', () => {
        const connectionConfig = { socket: undefined, tls: { enabled: true } };

        beforeEach('create user with mysql_native_password plugin', () => {
            return fixtures.createUser({ connectionConfig, password, plugin, user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache({ connectionConfig });
        });

        afterEach('delete the user created for a given test', () => {
            return fixtures.dropUser({ connectionConfig, user });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            return fixtures.dropUser({ connectionConfig, user });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when no authentication mechanism is selected', () => {
            context('using a connection configuration object', () => {
                it('connects with the right password using the PLAIN authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal('PLAIN');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password using the PLAIN authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal('PLAIN');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the PLAIN authentication mechanism is selected', () => {
            const auth = 'PLAIN';

            context('using a connection configuration object', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the MYSQL41 authentication mechanism is selected', () => {
            const auth = 'MYSQL41';

            context('using a connection configuration object', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('when the SHA256_MEMORY authentication mechanism is selected', () => {
            const auth = 'SHA256_MEMORY';

            context('and the server authentication cache does not contain the password', () => {
                context('using a connection configuration object', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });

            context('and the server authentication cache already contains the password', () => {
                beforeEach('ensure the password is stored in the server authentication cache', async () => {
                    await fixtures.savePasswordInAuthenticationCache({ connectionConfig, password, user });
                });

                context('using a connection configuration object', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        const session = await mysqlx.getSession(authConfig);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });

                    it('fails to connect with the wrong password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });
    });

    context('connecting over a local Unix socket', () => {
        const connectionConfig = { host: undefined, port: undefined, socket: process.env.MYSQLX_SOCKET, tls: { enabled: false } };

        beforeEach('skip tests on Windows or when the socket path is not defined', function () {
            const authConfig = { ...config, ...connectionConfig };

            if (authConfig.socket && os.platform() !== 'win32') {
                return;
            }

            return this.skip();
        });

        beforeEach('create user with mysql_native_password plugin', () => {
            return fixtures.createUser({ connectionConfig, password, plugin, user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache({ connectionConfig });
        });

        afterEach('delete the user created for a given test', function () {
            const authConfig = { ...config, ...connectionConfig };

            if (!authConfig.socket || os.platform() === 'win32') {
                // afterEach() is not "skipped" and needs to be explicitely
                // skipped.
                return this.skip();
            }

            return fixtures.dropUser({ connectionConfig, user });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            const authConfig = { ...config, ...connectionConfig };

            if (!authConfig.socket || os.platform() === 'win32') {
                // afterEach is not "skipped" and cannot also be explicitely
                // skipped, so, if there is no Unix socket, it is not possible
                // to connect to the server to delete the user.
                return;
            }

            return fixtures.dropUser({ connectionConfig, user });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when no authentication mechanism is selected', () => {
            context('using a connection configuration object', () => {
                it('connects with the right password using the PLAIN authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal('PLAIN');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password using the PLAIN authentication mechanism', async () => {
                    const authConfig = { ...config, ...connectionConfig, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal('PLAIN');

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the PLAIN authentication mechanism is selected', () => {
            const auth = 'PLAIN';

            context('using a connection configuration object', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        // irrelevant if the password is saved (or not) in the server cache
        context('when the MYSQL41 authentication mechanism is selected', () => {
            const auth = 'MYSQL41';

            context('using a connection configuration object', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };

                    const session = await mysqlx.getSession(authConfig);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(authConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('using a connection string', () => {
                it('connects with the right password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password, user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.inspect().auth).to.equal(auth);

                    await session?.close();
                });

                it('fails to connect with the wrong password', async () => {
                    const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        expect(err.message).to.match(/Access denied for user/);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('when the SHA256_MEMORY authentication mechanism is selected', () => {
            const auth = 'SHA256_MEMORY';

            context('and the server authentication cache does not contain the password', () => {
                context('using a connection configuration object', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('always fails to connect', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });

            context('and the server authentication cache already contains the password', () => {
                beforeEach('ensure the password is stored in the server authentication cache', async () => {
                    await fixtures.savePasswordInAuthenticationCache({ connectionConfig, password, user });
                });

                context('using a connection configuration object', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };

                        const session = await mysqlx.getSession(authConfig);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });

                    it('fails to connect with the wrong password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };

                        let session;

                        try {
                            session = await mysqlx.getSession(authConfig);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('using a connection string', () => {
                    it('connects with the right password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password, user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect().auth).to.equal(auth);

                        await session?.close();
                    });

                    it('fails to connect with the wrong password', async () => {
                        const authConfig = { ...config, ...connectionConfig, auth, password: password.concat(crypto.randomBytes(4).toString('hex')), user };
                        const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });
        });
    });
});
