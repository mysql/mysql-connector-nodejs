'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional MySQL 8.0.3 authentication', () => {
    context('mysql_native_password', () => {
        let auth;

        // MySQL 8.0.3 with mysql_native_password plugin (defined in docker.compose.yml)
        const port = 33060;

        context('default authentication mechanism', () => {
            it('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, { port, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal('PLAIN');
                        return session.close();
                    });
            });

            it('should authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, { port, socket: undefined, ssl: false });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
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

            it('should authenticate with TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('should authenticate without TLS', () => {
                const authConfig = Object.assign({}, config, { auth, port, socket: undefined, ssl: false });

                return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
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

            it('should authenticate with TLS', () => {
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

            context('with cached password', () => {
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
