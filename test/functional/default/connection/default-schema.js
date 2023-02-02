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

describe('connecting to a default schema', () => {
    // It is irrelevant wether the connection users TLS or a Unix socket.
    // What matters is that the default schema name is encoded as part of
    // the authentication parameters for each mechanism. So, the tests
    // should be repeated for each authentication mechanism.
    const user = 'user';
    const password = 'password';
    const schema = 'test';

    context('using the PLAIN authentication mechanism', () => {
        const auth = 'PLAIN';
        const connectionConfig = { socket: undefined, tls: { enabled: true } };

        beforeEach('create schema', async () => {
            await fixtures.createSchema(schema, connectionConfig);
        });

        beforeEach('create user', async () => {
            await fixtures.createUser({ connectionConfig, password, user });
        });

        afterEach('drop user', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        afterEach('drop schema', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        after('ensure users created by failing tests are dropped', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        after('ensure schemas created by failing tests are dropped', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        context('and a privileged user', () => {
            beforeEach('grant privileges to user', async () => {
                await fixtures.grantPrivileges({ connectionConfig, user });
            });

            context('with a connection configuration object', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('and a user without the appropriate privileges', () => {
            context('with a connection configuration object', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });
    });

    context('using the MYSQL41 authentication mechanism', () => {
        const auth = 'MYSQL41';
        const plugin = 'mysql_native_password';
        const connectionConfig = { socket: undefined, tls: { enabled: true } };

        beforeEach('create schema', async () => {
            await fixtures.createSchema(schema, connectionConfig);
        });

        beforeEach('create user with the mysql_native_password plugin', async () => {
            await fixtures.createUser({ connectionConfig, password, plugin, user });
        });

        afterEach('drop user', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        afterEach('drop schema', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        after('ensure users created by failing tests are dropped', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        after('ensure schemas created by failing tests are dropped', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        context('and a privileged user', () => {
            beforeEach('grant privileges to user', async () => {
                await fixtures.grantPrivileges({ connectionConfig, user });
            });

            context('with a connection configuration object', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, password, auth, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('and a user without the appropriate privileges', () => {
            context('with a connection configuration object', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });
    });

    context('using the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';
        const connectionConfig = { socket: undefined, tls: { enabled: true } };

        beforeEach('create schema', async () => {
            await fixtures.createSchema(schema, connectionConfig);
        });

        beforeEach('create user', async () => {
            await fixtures.createUser({ connectionConfig, password, user });
        });

        // the password must be stored in the server cache beforehand
        beforeEach('ensure the password is stored in the server authentication cache', async () => {
            await fixtures.savePasswordInAuthenticationCache({ connectionConfig, password, user });
        });

        afterEach('drop user', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        afterEach('drop schema', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        after('ensure users created by failing tests are dropped', async () => {
            await fixtures.dropUser({ connectionConfig, user });
        });

        after('ensure schemas created by failing tests are dropped', async () => {
            await fixtures.dropSchema(schema, connectionConfig);
        });

        context('and a privileged user', () => {
            beforeEach('grant privileges to user', async () => {
                await fixtures.grantPrivileges({ connectionConfig, user });
            });

            context('with a connection configuration object', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };

                    const session = await mysqlx.getSession(schemaConfig);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('configures the default schema in both the client and the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    expect(session.getDefaultSchema().getName).to.be.a('function');
                    expect(session.getDefaultSchema().getName()).to.equal(schema);

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    expect(got.fetchOne()[0]).to.equal(schema);

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is not defined', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: undefined, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('does not configure a default schema in the client or the server if the name is empty', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: '', user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    const session = await mysqlx.getSession(uri);
                    // eslint-disable-next-line no-unused-expressions
                    expect(session.getDefaultSchema()).to.not.exist;

                    const got = await session.sql('SELECT DATABASE()')
                        .execute();

                    // eslint-disable-next-line no-unused-expressions
                    expect(got.fetchOne()[0]).to.be.null;

                    await session?.close();
                });

                it('fails to connect if the schema does not exist in the server', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });

        context('and a user without the appropriate privileges', () => {
            context('with a connection configuration object', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };

                    let session;

                    try {
                        session = await mysqlx.getSession(schemaConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });

            context('with a connection string', () => {
                it('always fails to connect', async () => {
                    const schemaConfig = { ...config, ...connectionConfig, auth, password, schema, user };
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                    let session;

                    try {
                        session = await mysqlx.getSession(uri);
                        expect.fail();
                    } catch (err) {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                    } finally {
                        await session?.close();
                    }
                });
            });
        });
    });
});
