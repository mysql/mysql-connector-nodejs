'use strict';

/* eslint-env node, mocha */

const Session = require('lib/DevAPI/Session');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');
const os = require('os');
const path = require('path');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration X plugin session', () => {
    context('using a configuration object', () => {
        it('should connect to the server in a new session', () => {
            const tcpConfig = Object.assign({}, config);

            return expect(mysqlx.getSession(tcpConfig)).to.be.fulfilled;
        });

        it('should connect to the server with an IPv6 host', () => {
            const ipv6Config = Object.assign({}, config, { host: '::1' });

            return expect(mysqlx.getSession(ipv6Config)).to.be.fulfilled;
        });

        it('should connect to the server using SSL/TLS by default', () => {
            // X plugin socket connections do not support SSL/TLS.
            const secureConfig = Object.assign({}, config, { socket: undefined, ssl: true });

            return expect(mysqlx.getSession(secureConfig)).to.be.fulfilled.then(session => {
                expect(session.inspect()).to.have.property('ssl', true);
            });
        });

        it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
            const insecureConfig = Object.assign({}, config, { ssl: false });

            return expect(mysqlx.getSession(insecureConfig)).to.be.fulfilled.then(session => {
                expect(session.inspect()).to.have.property('ssl', false);
            });
        });

        it('should not connect if the credentials are invalid', () => {
            const invalidConfig = Object.assign({}, config, {
                dbUser: 'invalid user',
                dbPassword: 'invalid password'
            });

            return expect(mysqlx.getSession(invalidConfig)).to.be.rejected;
        });
    });

    context('using a RFC-3986 URI', () => {
        it('should connect to the server with an IPv6 host', () => {
            const ipv6Config = Object.assign({}, config, { host: '::1' });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
            const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port, socket: undefined, ssl: true };

            return mysqlx.getSession(uri).then(result => {
                expect(result).to.be.an.instanceof(Session);
                expect(result.inspect()).to.deep.equal(expected);
            });
        });

        it('should connect to the server in the default port', () => {
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.include({ port: config.port }));
        });

        it('should not connect if the port is out of bounds', () => {
            const invalidConfig = Object.assign({}, config, { port: -1 });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

            return mysqlx.getSession(uri).should.be.rejectedWith('Port must be between 0 and 65536');
        });

        it('should connect to the server using SSL/TLS by default', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
        });

        it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}?ssl-mode=DISABLED`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', false));
        });

        it('should connect to the server if an address is not reachable but there is a failover available', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                expect(session.inspect().port).to.deep.equal(failoverConfig.port);
            });
        });

        it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`${failoverConfig.host}, (address=[::1], priority=100)`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.rejected.then(err => {
                expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                expect(err.errno).to.equal(4000);
            });
        });

        it('should not connect to the server if any address priority is out of bounds', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`(address=${failoverConfig.host}, priority=100), (address=[::1], priority=101)`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.rejected.then(err => {
                expect(err.message).to.equal('The priorities must be between 0 and 100');
                expect(err.errno).to.equal(4007);
            });
        });

        it('should connect to the server with a local UNIX socket', function () {
            if (!config.socket) {
                return this.skip();
            }

            // Uses the default socket allocated for MySQL.
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})`;
            const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect()).to.deep.equal(expected);
            });
        });

        it('should ignore security options using a local UNIX socket', function () {
            if (!config.socket || os.platform() === 'win32') {
                return this.skip();
            }

            // Uses the default socket allocated for MySQL.
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
            const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect()).to.deep.equal(expected);
            });
        });
    });

    context('using a unified connection string', () => {
        it('should connect to the server with a string containing all the connection details', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

            return mysqlx
                .getSession(uri)
                .then(session => session.getSchemas())
                .then(result => expect(result).to.include.keys(config.schema));
        });

        it('should connect to the server in the default port', () => {
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.include({ port: config.port }));
        });

        it('should not connect if the port is out of bounds', () => {
            const invalidConfig = Object.assign({}, config, { port: 65537 });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

            return mysqlx.getSession(uri).should.be.rejectedWith('Port must be between 0 and 65536');
        });

        it('should connect to the server using SSL/TLS by default', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
        });

        it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}?ssl-mode=DISABLED`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', false));
        });

        it('should connect to the server if an address is not reachable but there is a failover available', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`(address=${failoverConfig.host}:${failoverConfig.port}, priority=99), (address=${failoverConfig.host}:${failoverConfig.port}, priority=100)`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                expect(session.inspect().port).to.deep.equal(failoverConfig.port);
            });
        });

        it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`(address=${failoverConfig.host}), (address=[::1], priority=100)`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.rejected.then(err => {
                expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                expect(err.errno).to.equal(4000);
            });
        });

        it('should not connect to the server if any address priority is out of bounds', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`(address=${failoverConfig.host}, priority=-1), (address=[::1], priority=100)`];
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.rejected.then(err => {
                expect(err.message).to.equal('The priorities must be between 0 and 100');
                expect(err.errno).to.equal(4007);
            });
        });

        it('should connect to the server with a local UNIX socket', function () {
            if (!config.socket) {
                return this.skip();
            }

            // Uses the default socket allocated for MySQL.
            const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})`;
            const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect()).to.deep.equal(expected);
            });
        });

        it('should ignore security options using a local UNIX socket', function () {
            if (!config.socket || os.platform() === 'win32') {
                return this.skip();
            }

            // Uses the default socket allocated for MySQL.
            const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
            const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect()).to.deep.equal(expected);
            });
        });
    });

    context('using a configuration handling interface', () => {
        beforeEach('set environment variables', () => {
            const filename = 'sessions.json';
            const rootDir = path.join(__dirname, '..', 'fixtures', 'configuration');

            process.env.MYSQL_SYSTEM_CONFIG = path.resolve(rootDir, 'system', filename);
            process.env.MYSQL_USER_CONFIG = path.resolve(rootDir, 'user', filename);
        });

        afterEach('unset environment variables', () => {
            process.env.MYSQL_SYSTEM_CONFIG = '';
            process.env.MYSQL_USER_CONFIG = '';
        });

        context('given a persistent session configuration object', () => {
            it('should connect by loading a session using the persistent configuration', () => {
                const expected = { dbUser: config.dbUser, host: config.host, port: config.port, socket: undefined, ssl: false };

                return expect(mysqlx.config.get(config.dbUser)).to.be.fulfilled
                    .then(sessionConfig => expect(mysqlx.getSession(sessionConfig, config.dbPassword)).to.be.fulfilled)
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });
        });

        context('given an object containing the session name', () => {
            it('should connect by loading an existing persistent session configuration', () => {
                const expected = { dbUser: config.dbUser, host: config.host, port: config.port, socket: undefined, ssl: false };

                return expect(mysqlx.getSession({ dbPassword: config.dbPassword, sessionName: config.dbUser })).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });

            it('should connect by loading and overriding an existing session with the given properties', () => {
                const expected = { dbUser: config.dbUser, host: '::1', port: config.port, socket: undefined, ssl: false };

                return expect(mysqlx.getSession({ host: '::1', dbPassword: config.dbPassword, sessionName: config.dbUser })).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });

            it('should connect using known property aliases', () => {
                const expected = { dbUser: config.dbUser, host: '::1', port: config.port, socket: undefined, ssl: true };

                return expect(mysqlx.getSession({ host: '::1', password: config.dbPassword, sessionName: config.dbUser })).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });
        });

        context('given a JSON string containing the session name', () => {
            it('should connect by loading an existing persistent session configuration', () => {
                const json = JSON.stringify({ dbPassword: config.dbPassword, sessionName: config.dbUser });
                const expected = { dbUser: config.dbUser, host: config.host, port: config.port, socket: undefined, ssl: true };

                return expect(mysqlx.getSession(json)).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });

            it('should connect by loading and overriding an existing session with the given properties', () => {
                const json = JSON.stringify({ host: '::1', dbPassword: config.dbPassword, sessionName: config.dbUser });
                const expected = { dbUser: config.dbUser, host: '::1', port: config.port, socket: undefined, ssl: true };

                return expect(mysqlx.getSession(json)).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });

            it('should connect using known property aliases', () => {
                const json = JSON.stringify({ host: '::1', password: config.dbPassword, sessionName: config.dbUser });
                const expected = { dbUser: config.dbUser, host: '::1', port: config.port, socket: undefined, ssl: true };

                return expect(mysqlx.getSession(json)).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.equal(expected));
            });
        });

        it('should provide access to the list of persistent sessions', () => {
            const expected = ['root', 'foo'];

            return expect(mysqlx.config.list()).to.be.fulfilled
                .then(sessions => expect(sessions).to.deep.equal(expected));
        });
    });

    context('database management', () => {
        it('should allow to drop an existing schema', () => {
            return mysqlx.getSession(config)
                .then(session => expect(session.dropSchema(config.schema)).to.be.fulfilled);
        });

        it('should not fail to drop a non-existent schema', () => {
            return mysqlx.getSession(config)
                .then(session => session.dropSchema(config.schema).then(() => session))
                .then(session => expect(session.dropSchema(config.schema)).to.be.fulfilled);
        });

        it('should fail to drop a schema with an empty name', () => {
            return mysqlx.getSession(config)
                .then(session => expect(session.dropSchema('')).to.be.rejected);
        });

        it('should fail to drop a schema with an invalid name', () => {
            return mysqlx.getSession(config)
                .then(session => expect(session.dropSchema(' ')).to.be.rejected);
        });

        it('should fail to drop a schema with name set to `null`', () => {
            return mysqlx.getSession(config)
                .then(session => expect(session.dropSchema(null)).to.be.rejected);
        });
    });
});
