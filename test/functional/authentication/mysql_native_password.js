'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');
const os = require('os');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional authentication', () => {
    context('mysql_native_password', () => {
        let auth, user, password;

        beforeEach('create schema', () => {
            return fixtures.createDefaultSchema();
        });

        beforeEach('setup test account', () => {
            user = 'test_mnp_user';
            password = 'test_mnp_password';

            return fixtures.createAccount({ user, password, plugin: 'mysql_native_password' });
        });

        afterEach('delete test account', () => {
            return fixtures.deleteAccount({ user });
        });

        context('default authentication mechanism', () => {
            context('secure connections', () => {
                // secure connections only make sense via TCP

                it('should authenticate with a session configuration object property', () => {
                    const authConfig = Object.assign({}, config, { user, password, socket: undefined, ssl: true });

                    return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('should authenticate with a URL parameter', () => {
                    return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}`)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });
            });

            context('insecure connections', () => {
                context('TCP', () => {
                    it('should authenticate with a session configuration object property', () => {
                        const authConfig = Object.assign({}, config, { user, password, socket: undefined, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal('MYSQL41');
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', () => {
                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?ssl-mode=DISABLED`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal('MYSQL41');
                                return session.close();
                            });
                    });
                });

                context('local UNIX socket', () => {
                    it('should authenticate with a session configuration object property', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const authConfig = Object.assign({}, config, { user, password, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal('PLAIN');
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@(${config.socket})?ssl-mode=DISABLED`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal('PLAIN');
                                return session.close();
                            });
                    });
                });
            });
        });

        context('MYSQL41 authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'MYSQL41';
            });

            context('secure connections', () => {
                // secure connections only make sense via TCP

                it('should authenticate with a session configuration object property', () => {
                    const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: true });

                    return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('should authenticate with a URL parameter', () => {
                    return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?auth=${auth}`)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('insecure connections', () => {
                context('TCP', () => {
                    it('should fail to authenticate with a session configuration object property', () => {
                        const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', () => {
                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?ssl-mode=DISABLED&auth=${auth}`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });
                });

                context('local UNIX socket', () => {
                    it('should authenticate with a session configuration object property', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const authConfig = Object.assign({}, config, { auth, user, password, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@(${config.socket})?ssl-mode=DISABLED&auth=${auth}`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });
                });
            });
        });

        context('PLAIN authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'PLAIN';
            });

            context('secure connections', () => {
                // secure connections only make sense via TCP

                it('should authenticate with a session configuration object property', () => {
                    const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: true });

                    return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('should authenticate with a URL parameter', () => {
                    return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?auth=${auth}`)).to.be.fulfilled
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('insecure connections', () => {
                context('TCP', () => {
                    it('should fail to authenticate with a session configuration object property', () => {
                        const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.rejected
                            .then(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1251);
                            });
                    });

                    it('should fail to authenticate with a URL parameter', () => {
                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?ssl-mode=DISABLED&auth=${auth}`)).to.be.rejected
                            .then(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1251);
                            });
                    });
                });

                context('local UNIX socket', () => {
                    it('should authenticate with a session configuration object property', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        const authConfig = Object.assign({}, config, { auth, user, password, ssl: false });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', function () {
                        if (!config.socket || os.platform() === 'win32') {
                            return this.skip();
                        }

                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@(${config.socket})?ssl-mode=DISABLED&auth=${auth}`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });
                });
            });
        });

        context('SHA256_MEMORY authentication mechanism', () => {
            beforeEach('setup authentication mechanism', () => {
                auth = 'SHA256_MEMORY';
            });

            context('without cached password', () => {
                context('secure connections', () => {
                    // secure connections only make sense via TCP

                    it('should fail to authenticate with a session configuration object property', () => {
                        const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: true });

                        return expect(mysqlx.getSession(authConfig)).to.be.rejected
                            .then(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1045);
                            });
                    });

                    it('should fail to authenticate with a URL parameter', () => {
                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?auth=${auth}`)).to.be.rejected
                            .then(err => {
                                expect(err.info).to.include.keys('code');
                                expect(err.info.code).to.equal(1045);
                            });
                    });
                });

                context('insecure connections', () => {
                    context('TCP', () => {
                        it('should fail to authenticate with a session configuration object property', () => {
                            const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: false });

                            return expect(mysqlx.getSession(authConfig)).to.be.rejected
                                .then(err => {
                                    expect(err.info).to.include.keys('code');
                                    expect(err.info.code).to.equal(1045);
                                });
                        });

                        it('should fail to authenticate with a URL parameter', () => {
                            return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?ssl-mode=DISABLED&auth=${auth}`)).to.be.rejected
                                .then(err => {
                                    expect(err.info).to.include.keys('code');
                                    expect(err.info.code).to.equal(1045);
                                });
                        });
                    });

                    context('local UNIX socket', () => {
                        it('should fail to authenticate with a session configuration object property', function () {
                            if (!config.socket || os.platform() === 'win32') {
                                return this.skip();
                            }

                            const authConfig = Object.assign({}, config, { auth, user, password, ssl: false });

                            return expect(mysqlx.getSession(authConfig)).to.be.rejected
                                .then(err => {
                                    expect(err.info).to.include.keys('code');
                                    expect(err.info.code).to.equal(1045);
                                });
                        });

                        it('should fail to authenticate with a URL parameter', function () {
                            if (!config.socket || os.platform() === 'win32') {
                                return this.skip();
                            }

                            return expect(mysqlx.getSession(`mysqlx://${user}:${password}@(${config.socket})?ssl-mode=DISABLED&auth=${auth}`)).to.be.rejected
                                .then(err => {
                                    expect(err.info).to.include.keys('code');
                                    expect(err.info.code).to.equal(1045);
                                });
                        });
                    });
                });
            });

            context('with cached password', () => {
                beforeEach('setup connection to save the password in the server cache', () => {
                    return mysqlx
                        .getSession(Object.assign({}, config, { auth: 'PLAIN', user, password }))
                        .then(session => session.close());
                });

                context('secure connections', () => {
                    // secure connections only make sense via TCP

                    it('should authenticate with a session configuration object property', () => {
                        const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: true });

                        return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });

                    it('should authenticate with a URL parameter', () => {
                        return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?auth=${auth}`)).to.be.fulfilled
                            .then(session => {
                                expect(session.inspect().auth).to.equal(auth);
                                return session.close();
                            });
                    });
                });

                context('insecure connections', () => {
                    context('TCP', () => {
                        it('should authenticate with a session configuration object property', () => {
                            const authConfig = Object.assign({}, config, { auth, user, password, socket: undefined, ssl: false });

                            return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                                .then(session => {
                                    expect(session.inspect().auth).to.equal(auth);
                                    return session.close();
                                });
                        });

                        it('should authenticate with a URL parameter', () => {
                            return expect(mysqlx.getSession(`mysqlx://${user}:${password}@${config.host}:${config.port}?ssl-mode=DISABLED&auth=${auth}`)).to.be.fulfilled
                                .then(session => {
                                    expect(session.inspect().auth).to.equal(auth);
                                    return session.close();
                                });
                        });
                    });

                    context('local UNIX socket', () => {
                        it('should authenticate with a session configuration object property', function () {
                            if (!config.socket || os.platform() === 'win32') {
                                return this.skip();
                            }

                            const authConfig = Object.assign({}, config, { auth, user, password, ssl: false });

                            return expect(mysqlx.getSession(authConfig)).to.be.fulfilled
                                .then(session => {
                                    expect(session.inspect().auth).to.equal(auth);
                                    return session.close();
                                });
                        });

                        it('should authenticate with a URL parameter', function () {
                            if (!config.socket || os.platform() === 'win32') {
                                return this.skip();
                            }

                            return expect(mysqlx.getSession(`mysqlx://${user}:${password}@(${config.socket})?ssl-mode=DISABLED&auth=${auth}`)).to.be.fulfilled
                                .then(session => {
                                    expect(session.inspect().auth).to.equal(auth);
                                    return session.close();
                                });
                        });
                    });
                });
            });
        });
    });
});
