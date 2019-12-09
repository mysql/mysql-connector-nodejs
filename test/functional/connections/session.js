'use strict';

/* eslint-env node, mocha */

const Session = require('../../../lib/DevAPI/Session');
const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');
const os = require('os');

describe('X plugin session', () => {
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
            it('connects to the server in a new session', () => {
                const tcpConfig = Object.assign({}, config, { schema: undefined, socket: undefined });

                return mysqlx.getSession(tcpConfig)
                    .then(session => session.close());
            });

            it('connects to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1', schema: undefined, socket: undefined });

                return mysqlx.getSession(ipv6Config)
                    .then(session => session.close());
            });

            it('connects to the server using SSL/TLS by default', () => {
                // X plugin socket connections do not support SSL/TLS.
                const secureConfig = Object.assign({}, config, { schema: undefined, socket: undefined, ssl: true });

                return mysqlx.getSession(secureConfig)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('connects to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const insecureConfig = Object.assign({}, config, { ssl: false, schema: undefined, socket: undefined });

                return mysqlx.getSession(insecureConfig)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('fails to connect with the default configuration', () => {
                const defaultConfig = Object.assign({}, config, { dbUser: '', schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails to connect if the credentials are invalid', () => {
                const invalidConfig = Object.assign({}, config, { dbUser: 'invalid user', dbPassword: 'invalid password' });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails to connect if the default schema does not exist', () => {
                const validConfig = Object.assign({}, config, { socket: undefined });

                return mysqlx.getSession(validConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1049);
                    });
            });

            context('enable SRV resolution', () => {
                it('fails when a unix socket is used', function () {
                    if (!config.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const invalidConfig = Object.assign({}, config, { port: undefined, resolveSrv: true });

                    return mysqlx.getSession(invalidConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
                });

                it('fails when a port is specified', () => {
                    const invalidConfig = Object.assign({}, config, { resolveSrv: true, socket: undefined });

                    return mysqlx.getSession(invalidConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
                });

                it('fails when the "resolveSrv" property is not boolean', () => {
                    const invalidConfig = Object.assign({}, config, { port: undefined, resolveSrv: 'true', socket: undefined });

                    return mysqlx.getSession(invalidConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('SRV resolution can only be toggled using a boolean value (true or false).'));
                });
            });
        });

        context('using a RFC-3986 URI', () => {
            it('connects to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });
                const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
                const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port, schema: undefined, socket: undefined, ssl: true };

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session).to.be.an.instanceof(Session);
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('fails to connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: -1 });
                const uri = `mysqlx://${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;
                const error = 'Port must be between 0 and 65536';

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });

            it('connects to the server using SSL/TLS by default', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('connects to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}?ssl-mode=DISABLED`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('connects to the server if the first address in a random list is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('connects to the server if the first address in a random list is reachable', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}:${failoverConfig.port}`, `${failoverConfig.host}:${failoverConfig.port + 1000}`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('fails to connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}, (address=[::1], priority=100)`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('fails to connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=100), (address=[::1], priority=101)`];
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('fails to connect if the default schema does not exist', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1049);
                    });
            });

            it('connects to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('ignores security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            context('enable SRV resolution', () => {
                it('fails when a unix socket is used', function () {
                    if (!config.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx+srv://${config.dbUser}:${config.dbPassword}@(${config.socket})`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
                });

                it('fails when a port is specified', () => {
                    const uri = `mysqlx+srv://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
                });

                it('fails when multiple endpoints with implicit priority are specified', () => {
                    const failoverConfig = Object.assign({}, config);
                    const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
                    const uri = `mysqlx+srv://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
                });

                it('fails when multiple endpoints with explicit priority are specified', () => {
                    const failoverConfig = Object.assign({}, config);
                    const hosts = [`(address=${failoverConfig.host}:${failoverConfig.port}, priority=99), (address=${failoverConfig.host}:${failoverConfig.port}, priority=100)`];
                    const uri = `mysqlx+srv://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
                });
            });
        });

        context('using a unified connection string', () => {
            it('fails to connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: 65537 });
                const uri = `${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;
                const error = 'Port must be between 0 and 65536';

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });

            it('connects to the server using SSL/TLS by default', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('connects to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}?ssl-mode=DISABLED`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('connects to the server if an address is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}:${failoverConfig.port}, priority=99), (address=${failoverConfig.host}:${failoverConfig.port}, priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('fails to connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}), (address=[::1], priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('fails to connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=-1), (address=[::1], priority=100)`];
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('fails to connect if the default schema does not exist', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1049);
                    });
            });

            it('connects to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('ignores security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });
        });

        context('using invalid parameters', () => {
            it('fails to connect if parameter is not string or object', () => {
                return mysqlx.getSession(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails to connect if URI is not valid', () => {
                return mysqlx.getSession('')
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });
    });
});
