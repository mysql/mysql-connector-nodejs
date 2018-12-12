'use strict';

/* eslint-env node, mocha */

const Session = require('lib/DevAPI/Session');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');
const os = require('os');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional X plugin session', () => {
    context('creating new sessions', () => {
        beforeEach('password caching', () => {
            // Since MySQL 8.0.11 introduces `caching_sha2_password` as the default authentication
            // plugin, we need to make sure the password is, indeed, cached on the server before
            // testing some of the following scenarios.
            return mysqlx
                .getSession(Object.assign({}, config, { schema: undefined, socket: undefined }))
                .then(session => session.close());
        });

        context('using a configuration object', () => {
            it('should connect to the server in a new session', () => {
                const tcpConfig = Object.assign({}, config, { schema: undefined, socket: undefined });

                return expect(mysqlx.getSession(tcpConfig)).to.be.fulfilled
                    .then(session => session.close());
            });

            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1', schema: undefined, socket: undefined });

                return expect(mysqlx.getSession(ipv6Config)).to.be.fulfilled
                    .then(session => session.close());
            });

            it('should connect to the server using SSL/TLS by default', () => {
                // X plugin socket connections do not support SSL/TLS.
                const secureConfig = Object.assign({}, config, { schema: undefined, socket: undefined, ssl: true });

                return expect(mysqlx.getSession(secureConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const insecureConfig = Object.assign({}, config, { ssl: false, schema: undefined, socket: undefined });

                return expect(mysqlx.getSession(insecureConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should not connect with the default configuration', () => {
                const defaultConfig = Object.assign({}, config, { dbUser: '', schema: undefined });

                return expect(mysqlx.getSession(defaultConfig)).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('should not connect if the credentials are invalid', () => {
                const invalidConfig = Object.assign({}, config, {
                    dbUser: 'invalid user',
                    dbPassword: 'invalid password'
                });

                return expect(mysqlx.getSession(invalidConfig)).to.be.rejected;
            });

            it('should not connect if the default schema does not exist', () => {
                const validConfig = Object.assign({}, config, { socket: undefined });

                return expect(mysqlx.getSession(validConfig)).to.be.rejected;
            });
        });

        context('using a RFC-3986 URI', () => {
            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });
                const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
                const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port, schema: undefined, socket: undefined, ssl: true };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session).to.be.an.instanceof(Session);
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should not connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: -1 });
                const uri = `mysqlx://${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith('Port must be between 0 and 65536');
            });

            it('should connect to the server using SSL/TLS by default', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}?ssl-mode=DISABLED`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should connect to the server if an address is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}, (address=[::1], priority=100)`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('should not connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=100), (address=[::1], priority=101)`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('should not connect if the default schema does not exist', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return expect(mysqlx.getSession(uri)).to.be.rejected;
            });

            it('should connect to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should ignore security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });
        });

        context('using a unified connection string', () => {
            it('should not connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: 65537 });
                const uri = `${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith('Port must be between 0 and 65536');
            });

            it('should connect to the server using SSL/TLS by default', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}?ssl-mode=DISABLED`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should connect to the server if an address is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}:${failoverConfig.port}, priority=99), (address=${failoverConfig.host}:${failoverConfig.port}, priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}), (address=[::1], priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('should not connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=-1), (address=[::1], priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('should not connect if the default schema does not exist', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return expect(mysqlx.getSession(uri)).to.be.rejected;
            });

            it('should connect to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should ignore security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });
        });

        context('using invalid parameters', () => {
            it('should not connect if parameter is not string or object', () => {
                return expect(mysqlx.getSession(null)).to.be.rejected;
            });

            it('should not connect if URI is not valid', () => {
                return expect(mysqlx.getSession('')).to.be.rejected;
            });
        });
    });
});
