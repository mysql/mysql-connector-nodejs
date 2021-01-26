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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');

describe('connecting to a default schema', () => {
    const baseConfig = {};

    context('with different authentication mechanisms', () => {
        const schema = 'default';

        context('MYSQL41', () => {
            const auth = 'MYSQL41';
            const user = 'foo';
            const password = 'bar';
            const plugin = 'mysql_native_password';

            context('using TCP and TLS', () => {
                const tlsConfig = { auth, socket: undefined, ssl: true };

                beforeEach('create the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('create user with mysql_native_password plugin', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.createUser(user, plugin, password, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                afterEach('delete user', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.dropUser(user, schemaConfig);
                });

                afterEach('drop the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });

            context('using regular TCP', () => {
                const tcpConfig = { auth, socket: undefined, ssl: false };

                beforeEach('create the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('create user with mysql_native_password plugin', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                afterEach('delete user', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, schemaConfig);
                });

                afterEach('drop the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });

            context('using a UNIX socket', () => {
                const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

                beforeEach('create the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('create user with mysql_native_password plugin', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createUser(user, plugin, password, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                afterEach('delete user', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropUser(user, schemaConfig);
                });

                afterEach('drop the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: undefined, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: '', user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: undefined, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: '', user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: undefined, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: '', user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: undefined, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: '', user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });
        });

        // PLAIN authentication only works with TCP using TLS or with a local
        // UNIX socket (see test/functional/default/authentication/*.js)
        context('PLAIN', () => {
            const auth = 'PLAIN';

            context('using TCP and TLS', () => {
                const tlsConfig = { auth, socket: undefined };

                beforeEach('create the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.createSchema(schema, schemaConfig);
                });

                afterEach('drop the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });

            context('using a UNIX socket', () => {
                const socketConfig = { auth, host: undefined, ssl: false };

                beforeEach('create the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createSchema(schema, schemaConfig);
                });

                afterEach('drop the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });
        });

        context('SHA256_MEMORY', () => {
            const auth = 'SHA256_MEMORY';

            context('using TCP and TLS', () => {
                const tlsConfig = { auth, socket: undefined, ssl: true };

                beforeEach('create the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.savePasswordInAuthenticationCache(schemaConfig);
                });

                afterEach('drop the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig);

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, tlsConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });

            context('using regular TCP', () => {
                const tcpConfig = { auth, socket: undefined, ssl: false };

                beforeEach('create the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.savePasswordInAuthenticationCache(schemaConfig);
                });

                afterEach('drop the default schema', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });

            context('using a UNIX socket', () => {
                const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

                beforeEach('create the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createSchema(schema, schemaConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(schemaConfig);
                });

                beforeEach('save the password in the server authentication cache', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.savePasswordInAuthenticationCache(schemaConfig);
                });

                afterEach('drop the default schema', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropSchema(schema, schemaConfig);
                });

                context('connecting with a configuration object', () => {
                    it('sets the given default schema on the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });

                context('connecting with a URI', () => {
                    it('sets the given default schema on the server', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: undefined });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: '' });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1049);
                            });
                    });
                });
            });
        });
    });

    context('with a schema name containing special characters', () => {
        const schema = '$_^%$';

        beforeEach('create the default schema', () => {
            const schemaConfig = Object.assign({}, config, baseConfig);

            return fixtures.createSchema(schema, schemaConfig);
        });

        afterEach('drop the default schema', () => {
            const schemaConfig = Object.assign({}, config, baseConfig);

            return fixtures.dropSchema(schema, schemaConfig);
        });

        context('using a configuration object', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                        return session.close();
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                        return session.close();
                    });
            });
        });
    });

    context('with a schema called "null"', () => {
        const schema = '$_^%$';

        beforeEach('create the default schema', () => {
            const schemaConfig = Object.assign({}, config, baseConfig);

            return fixtures.createSchema(schema, schemaConfig);
        });

        afterEach('drop the default schema', () => {
            const schemaConfig = Object.assign({}, config, baseConfig);

            return fixtures.dropSchema(schema, schemaConfig);
        });

        context('using a configuration object', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                        return session.close();
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                        return session.close();
                    });
            });
        });
    });

    context('executing SQL statements', () => {
        const schema = 'test';

        context('with an existing schema', () => {
            beforeEach('create the default schema', () => {
                const schemaConfig = Object.assign({}, config, baseConfig);

                return fixtures.createSchema(schema, schemaConfig);
            });

            afterEach('drop the default schema', () => {
                const schemaConfig = Object.assign({}, config, baseConfig);

                return fixtures.dropSchema(schema, schemaConfig);
            });

            it('does not require the schema name', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        return session.sql('CREATE TABLE test (name VARCHAR(3))').execute()
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });

        context('with a non-existing schema', () => {
            it('yields a corresponding SQL error', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => session.sql('CREATE TABLE test (name VARCHAR(3))').execute())
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1049);
                    });
            });
        });
    });
});
