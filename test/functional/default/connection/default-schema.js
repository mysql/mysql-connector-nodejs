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

describe('connecting to the default schema', () => {
    context('with the MYSQL41 authentication mechanism', () => {
        const schema = 'test';
        const auth = 'MYSQL41';
        const user = 'user';
        const password = 'password';
        const plugin = 'mysql_native_password';

        beforeEach('create the default schema', () => {
            return fixtures.createSchema({ schema });
        });

        beforeEach('create user with mysql_native_password plugin', () => {
            return fixtures.createUser({ password, plugin, user });
        });

        beforeEach('grant privileges to user', () => {
            return fixtures.grantPrivileges({ user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache();
        });

        afterEach('delete the user created for a given test', () => {
            return fixtures.dropUser({ user });
        });

        afterEach('drop the default schema', () => {
            return fixtures.dropSchema({ schema });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            return fixtures.dropUser({ user });
        });

        after('delete any dangling schema created for tests that have been skipped', () => {
            return fixtures.dropSchema({ schema });
        });

        context('using TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });

        context('using regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });
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
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });
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
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });

        context('using a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });
    });

    // PLAIN authentication only works with TCP using TLS or with a local
    // UNIX socket (see test/functional/default/authentication/*.js)
    context('with the PLAIN authentication mechanism', () => {
        const schema = 'test';
        const auth = 'PLAIN';
        const user = 'user';
        const password = 'password';

        beforeEach('create the default schema', () => {
            return fixtures.createSchema({ schema });
        });

        beforeEach('create user with default plugin', () => {
            return fixtures.createUser({ password, user });
        });

        beforeEach('grant privileges to user', () => {
            return fixtures.grantPrivileges({ user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache();
        });

        afterEach('delete the user created for a given test', () => {
            return fixtures.dropUser({ user });
        });

        afterEach('drop the default schema', () => {
            return fixtures.dropSchema({ schema });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            return fixtures.dropUser({ user });
        });

        after('delete any dangling schema created for tests that have been skipped', () => {
            return fixtures.dropSchema({ schema });
        });

        context('using TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema in the client', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: undefined });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: '' });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: undefined });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: '' });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: undefined });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: '' });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });

        context('using a UNIX socket', () => {
            const socketConfig = { host: undefined, tls: { enabled: false } };

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: undefined });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: '' });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: undefined });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: '' });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema in the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: undefined });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: '' });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: undefined });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: '' });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, schema: schema.concat(crypto.randomBytes(4).toString('hex')) });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });
    });

    context('with the SHA256_MEMORY authentication mechanism', () => {
        const schema = 'test';
        const auth = 'SHA256_MEMORY';
        const user = 'user';
        const password = 'password';

        beforeEach('create the default schema', () => {
            return fixtures.createSchema({ schema });
        });

        beforeEach('create user with default plugin', () => {
            return fixtures.createUser({ password, user });
        });

        beforeEach('grant privileges to user', () => {
            return fixtures.grantPrivileges({ user });
        });

        beforeEach('invalidate the server authentication cache', () => {
            return fixtures.resetAuthenticationCache();
        });

        afterEach('delete the user created for a given test', () => {
            return fixtures.dropUser({ user });
        });

        afterEach('drop the default schema', () => {
            return fixtures.dropSchema({ schema });
        });

        after('delete any dangling user created for tests that have been skipped', () => {
            return fixtures.dropUser({ user });
        });

        context('using TCP and TLS', () => {
            const tlsConfig = { socket: undefined, tls: { enabled: true } };

            beforeEach('save password in the authentication cache', () => {
                return fixtures.savePasswordInAuthenticationCache({ password, user });
            });

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });
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
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', function () {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tlsConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });

        context('using regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            beforeEach('save password in the authentication cache', () => {
                return fixtures.savePasswordInAuthenticationCache({ password, user });
            });

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.be.null)
                                    .then(() => session.close());
                            });
                    });

                    it('sets the given default schema on the client', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });
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
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });
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
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: undefined, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is empty', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: '', user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                // eslint-disable-next-line no-unused-expressions
                                expect(session.getDefaultSchema()).to.not.exist;
                                return session.close();
                            });
                    });

                    it('fails if the default schema does not exist', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', () => {
                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, tcpConfig, { auth, password, schema, user });
                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });

        context('using a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, tls: { enabled: false } };

            beforeEach('save password in the authentication cache', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.savePasswordInAuthenticationCache({ password, user });
            });

            context('connecting with a configuration object', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the server when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', () => {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return mysqlx.getSession(schemaConfig)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });

            context('connecting with a URI', () => {
                context('when the user has the appropriate privileges for the schema', () => {
                    it('sets the given default schema on the server', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                return session.sql('SELECT DATABASE()')
                                    .execute()
                                    .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                                    .then(() => session.close());
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(session => {
                                expect(session.getDefaultSchema().getName()).to.equal(schema);
                                return session.close();
                            });
                    });

                    it('does not set any schema in the client when the default schema name is not defined', function () {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: undefined, user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: '', user });

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
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema: schema.concat(crypto.randomBytes(4).toString('hex')), user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                            });
                    });
                });

                context('when the user does not have the appropriate privileges for the schema', function () {
                    beforeEach('revoke user privileges', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return fixtures.revokePrivileges({ user });
                    });

                    it('fails to authorize the connection', () => {
                        const schemaConfig = Object.assign({}, config, socketConfig, { auth, password, schema, user });

                        if (!schemaConfig.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.info).to.include.keys('code');
                                return expect(err.info.code).to.equal(errors.ER_DBACCESS_DENIED_ERROR);
                            });
                    });
                });
            });
        });
    });

    context('with a schema name containing special characters', () => {
        const schema = '$_^%$';

        beforeEach('create the default schema', () => {
            return fixtures.createSchema({ schema });
        });

        afterEach('drop the default schema', () => {
            return fixtures.dropSchema({ schema });
        });

        context('using a configuration object', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schema);
                        return session.close();
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schema);
                        return session.close();
                    });
            });
        });
    });

    context('with a schema called "null"', () => {
        const schema = 'null';

        beforeEach('create the default schema', () => {
            return fixtures.createSchema({ schema });
        });

        afterEach('drop the default schema', () => {
            return fixtures.dropSchema({ schema });
        });

        context('using a configuration object', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schema);
                        return session.close();
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the given default schema on the server', () => {
                const schemaConfig = Object.assign({}, config, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(schema))
                            .then(() => session.close());
                    });
            });

            it('sets the given default schema on the client', () => {
                const schemaConfig = Object.assign({}, config, { schema });
                const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${encodeURIComponent(schemaConfig.schema)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.getDefaultSchema().getName()).to.equal(schema);
                        return session.close();
                    });
            });
        });
    });

    context('executing SQL statements', () => {
        const schema = 'test';

        context('with an existing schema', () => {
            beforeEach('create the default schema', () => {
                return fixtures.createSchema({ schema });
            });

            afterEach('drop the default schema', () => {
                return fixtures.dropSchema({ schema });
            });

            it('does not require the schema name', () => {
                const schemaConfig = Object.assign({}, config, { schema });

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
                const schemaConfig = Object.assign({}, config, { schema });

                return mysqlx.getSession(schemaConfig)
                    .then(session => session.sql('CREATE TABLE test (name VARCHAR(3))').execute())
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        return expect(err.info.code).to.equal(errors.ER_BAD_DB_ERROR);
                    });
            });
        });
    });
});
