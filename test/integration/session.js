'use strict';

/* eslint-env node, mocha */

const Session = require('lib/DevAPI/Session');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration X plugin session', () => {
    context('using a configuration object', () => {
        it('should connect to the server in a new session', () => {
            return expect(mysqlx.getSession(config)).to.be.fulfilled;
        });

        it('should connect to the server with an IPv6 host', () => {
            const ipv6Config = Object.assign({}, config, { host: '::1', socket: undefined });

            return expect(mysqlx.getSession(ipv6Config)).to.be.fulfilled;
        });

        it('should not connect if the credentials are invalid', () => {
            const invalidConfig = Object.assign({}, config, {
                dbUser: 'invalid user',
                dbPassword: 'invalid password',
                socket: undefined
            });

            return expect(mysqlx.getSession(invalidConfig)).to.be.rejected;
        });
    });

    context('using a RFC-3986 URI', () => {
        it('should connect to the server with an IPv6 host', () => {
            const ipv6Config = Object.assign({}, config, { host: '::1' });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
            const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port, socket: undefined, ssl: false };

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

        it('should connect to the server using SSL/TLS', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}/?ssl-enable`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
        });

        it('should connect to the server if an address is not reachable but there is a failover available', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1}`, `${failoverConfig.host}:${failoverConfig.port}`];
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

            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})`;
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

        it('should connect to the server using SSL/TLS', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}/?ssl-enable`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
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
    });
});
