'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@docker MySQL 8.0.3 authentication', () => {
    context('sha256_password', () => {
        let auth;

        // MySQL 8.0.3 server port (defined in docker.compose.yml)
        const baseConfig = { password: 'mnpp', port: 33064, schema: undefined, socket: undefined, user: 'mnpu' };

        beforeEach('setup test account', () => {
            return fixtures.createAccount({ password: baseConfig.password, plugin: 'sha256_password', port: baseConfig.port, user: baseConfig.user });
        });

        afterEach('delete test account', () => {
            return fixtures.deleteAccount({ user: baseConfig.user, port: baseConfig.port });
        });

        context('default authentication mechanism', () => {
            it('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, baseConfig, { ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, baseConfig, { ssl: false });

                return expect(mysqlx.getSession(authConfig)).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('MYSQL41 authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'MYSQL41';
            });

            it('should fail to authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                return expect(mysqlx.getSession(authConfig)).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('PLAIN authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'PLAIN';
            });

            it('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                return expect(mysqlx.getSession(authConfig)).to.be.rejected
                    .then(err => {
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
                it('should fail to authenticate with TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });

                it('should fail to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });
            });

            context('with cached password', () => {
                beforeEach('setup connection to save the password in the server cache', () => {
                    return mysqlx
                        .getSession(Object.assign({}, config, baseConfig, { auth: 'PLAIN', ssl: true }))
                        .then(session => session.close());
                });

                it('should fail to authenticate with TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: true });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });

                it('should fail to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, baseConfig, { auth, ssl: false });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });
            });
        });
    });
});
