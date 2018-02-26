'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional MySQL 5.7 authentication', () => {
    context('sha256_password', () => {
        let auth;

        // MySQL 5.7 server port (defined in docker.compose.yml)
        const port = 33065;

        context('default authentication mechanism', () => {
            // TODO(Rui): this test should be passing, because the client falls back to "PLAIN" but it fails
            // with an authentication error (code 1045), so, there might be some issue in the x-plugin.
            // More details on https://dev.mysql.com/doc/refman/5.7/en/sha256-pluggable-authentication.html.
            it.skip('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, { port, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, { port, socket: undefined, ssl: false });

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

            // The "MYSQL41" authentication mechanism is only meant to work for mysql_native_password accounts.
            it('should fail to authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: false });

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

            // TODO(Rui): according to the server documentation, this test should pass, but that's currently not
            // happening, and it fails with an authentication error (code 1045).
            // More details on https://dev.mysql.com/doc/refman/5.7/en/sha256-pluggable-authentication.html.
            it.skip('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('should fail to authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: false });

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
                    const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: true });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });

                it('should fail to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: false });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });
            });

            // TODO(Rui): authentication fails with "PLAIN", which means we can't save the password in the cache before.
            context.skip('with cached password', () => {
                beforeEach('setup connection to save the password in the server cache', () => {
                    return mysqlx
                        .getSession(Object.assign({}, config, { auth: 'PLAIN', port, socket: undefined, ssl: true }))
                        .then(session => session.close());
                });

                it('should fail to authenticate with TLS', () => {
                    const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: true });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });

                it('should fail to authenticate without TLS', () => {
                    const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: false });

                    return expect(mysqlx.getSession(authConfig))
                        .to.be.rejectedWith('SHA256_MEMORY authentication is not supported by the server.');
                });
            });
        });
    });
});
