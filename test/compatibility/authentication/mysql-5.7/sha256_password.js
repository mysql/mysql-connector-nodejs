'use strict';

/* eslint-env node, mocha */

const config = require('../../../../test/properties');
const expect = require('chai').expect;
const fixtures = require('../../../../test/fixtures');
const mysqlx = require('../../../../');

describe('MySQL 5.7 authentication', () => {
    context('sha256_password', () => {
        let auth;

        // MySQL 5.7 server port (defined in docker.compose.yml)
        const baseConfig = { password: 'spp', port: 33063, schema: undefined, socket: undefined, user: 'spu' };

        beforeEach('setup test account', () => {
            return fixtures.createAccount({ password: baseConfig.password, plugin: 'sha256_password', port: baseConfig.port, user: baseConfig.user });
        });

        afterEach('delete test account', () => {
            return fixtures.deleteAccount({ port: baseConfig.port, user: baseConfig.user });
        });

        context('default authentication mechanism', () => {
            // TODO(Rui): this test should be passing, because the client falls back to "PLAIN" but it fails
            // with an authentication error (code 1045), so, there might be some issue in the x-plugin.
            // More details on https://dev.mysql.com/doc/refman/5.7/en/sha256-pluggable-authentication.html.
            it.skip('authenticates with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { ssl: true });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('fails to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { ssl: false });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('MYSQL41 authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'MYSQL41';
            });

            // The "MYSQL41" authentication mechanism is only meant to work for mysql_native_password accounts.
            it('fails to authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('PLAIN authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'PLAIN';
            });

            // TODO(Rui): according to the server documentation, this test passs, but that's currently not
            // happening, and it fails with an authentication error (code 1045).
            // More details on https://dev.mysql.com/doc/refman/5.7/en/sha256-pluggable-authentication.html.
            it.skip('authenticates with TLS', () => {
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

            // TODO(Rui): authentication fails with "PLAIN", which means we can't save the password in the cache before.
            context.skip('with cached password', () => {
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
