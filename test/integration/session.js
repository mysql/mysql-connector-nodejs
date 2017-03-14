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
            const ipv6Config = Object.assign({}, config, { host: '::1' });

            return expect(mysqlx.getSession(ipv6Config)).to.be.fulfilled;
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
            const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port };

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

        it('should connect to the server using SSL/TLS', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}/?ssl-enable`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
        });

        it('should connect to the server or router using a failover address', () => {
            const hosts = ['[::1]', '127.0.0.1'];
            const failoverConfig = Object.assign({}, config, { host: undefined });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect().host).to.equal('::1');
                expect(session.inspect().port).to.equal(33060);
            });
        });
    });

    context('using an unified connection string', () => {
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

        it('should connect to the server using SSL/TLS', () => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${config.dbUser}:${config.dbPassword}@${config.host}/?ssl-enable`;

            return mysqlx
                .getSession(uri)
                .then(result => expect(result.inspect()).to.have.property('ssl', true));
        });

        it('should connect to the server or router using a failover address', () => {
            const hosts = ['(127.0.0.1, priority=99)', '([::1]:33060, priority=100)'];
            const failoverConfig = Object.assign({}, config, { host: undefined });
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri).should.be.fulfilled.then(session => {
                expect(session.inspect().host).to.deep.equal('::1');
                expect(session.inspect().port).to.deep.equal(33060);
            });
        });
    });
});

