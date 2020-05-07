'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const crypto = require('crypto');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');

describe('default schema with multiple authentication mechanisms', () => {
    const schema = 'default';
    const baseConfig = {};

    context('MYSQL41', () => {
        const auth = 'MYSQL41';
        const user = 'foo';
        const password = 'bar';
        const plugin = 'mysql_native_password';

        context('using TCP and TLS', () => {
            const tcpConfig = { auth, socket: undefined, ssl: true };

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

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            return session.sql('SELECT DATABASE()')
                                .execute()
                                .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                .then(() => session.close());
                        });
                });

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { password, schema, user });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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

            afterEach('drop the default schema', () => {
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
            const tcpConfig = { auth, socket: undefined };

            beforeEach('create the default schema', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.createSchema(schema, schemaConfig);
            });

            afterEach('drop the default schema', () => {
                const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.dropSchema(schema, schemaConfig);
            });

            context('connecting with a configuration object', () => {
                it('sets the given default schema in the server', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            return session.sql('SELECT DATABASE()')
                                .execute()
                                .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                .then(() => session.close());
                        });
                });

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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
                it('sets the given default schema in the server', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            return session.sql('SELECT DATABASE()')
                                .execute()
                                .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                .then(() => session.close());
                        });
                });

                it('sets the given default schema in the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?&auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                            return session.close();
                        });
                });

                it('fails if the default schema does not exist', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
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

                it('sets the given default schema in the client', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, socketConfig, { schema });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@(${schemaConfig.socket})/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    if (!schemaConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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
            const tcpConfig = { auth, socket: undefined, ssl: true };

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

                it('sets the given default schema on the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            return session.sql('SELECT DATABASE()')
                                .execute()
                                .then(res => expect(res.fetchOne()[0]).to.equal(schemaConfig.schema))
                                .then(() => session.close());
                        });
                });

                it('sets the given default schema on the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
                            return session.close();
                        });
                });

                it('fails if the default schema does not exist', function () {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema: schema.concat(crypto.randomBytes(4).toString('hex')) });
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

                it('sets the given default schema on the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });

                    return mysqlx.getSession(schemaConfig)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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

                it('sets the given default schema on the client', () => {
                    const schemaConfig = Object.assign({}, config, baseConfig, tcpConfig, { schema });
                    const uri = `mysqlx://${schemaConfig.user}:${schemaConfig.password}@${schemaConfig.host}:${schemaConfig.port}/${schemaConfig.schema}?ssl-mode=DISABLED&auth=${schemaConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.getDefaultSchema().getName()).to.equal(schemaConfig.schema);
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
