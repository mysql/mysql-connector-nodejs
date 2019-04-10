'use strict';

/* eslint-env node, mocha */

const config = require('../../../../test/properties');
const expect = require('chai').expect;
const fixtures = require('../../../../test/fixtures');
const mysqlx = require('../../../../');

describe('MySQL 5.7 authentication', () => {
    context('mysql_native_password', () => {
        let auth;

        // MySQL 5.7 server port (defined in docker.compose.yml)
        const baseConfig = { password: 'mnpp', port: 33063, schema: undefined, socket: undefined, user: 'mnpu' };

        beforeEach('setup test account', () => {
            return fixtures.createAccount({ password: baseConfig.password, plugin: 'mysql_native_password', port: baseConfig.port, user: baseConfig.user });
        });

        afterEach('delete test account', () => {
            return fixtures.deleteAccount({ port: baseConfig.port, user: baseConfig.user });
        });

        context('default authentication mechanism', () => {
            it('authenticates with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { ssl: true });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('authenticates without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { ssl: false });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('MYSQL41');
                        return session.close();
                    });
            });
        });

        context('MYSQL41 authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'MYSQL41';
            });

            it('authenticates with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('authenticates without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });
        });

        context('PLAIN authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'PLAIN';
            });

            it('authenticates with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1251);
                    });
            });
        });

        context('SHA256_MEMORY authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'SHA256_MEMORY';
            });

            context('without cached password', () => {
                it('fails to authenticate with TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
                });

                it('fails to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
                });
            });

            context('with cached password', () => {
                beforeEach('setup connection to save the password in the server cache', () => {
                    return mysqlx.getSession(Object.assign({}, config, baseConfig, { auth: 'PLAIN', ssl: true }))
                        .then(session => session.close());
                });

                it('fails to authenticate with TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
                });

                it('fails to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
                });
            });
        });
    });
});
