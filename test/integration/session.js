'use strict';

/* eslint-env node, mocha */

const BaseSession = require('lib/DevAPI/BaseSession');
const config = require('./properties');
const expect = require('chai').expect;
const mysqlx = require('index');

describe('@integration server connection', () => {
    context('single server running the X plugin', () => {
        context('using a configuration object', () => {
            it('should connect to the server in a new session', () => {
                return mysqlx.getNodeSession(config).should.be.fulfilled;
            });

            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });

                return mysqlx.getNodeSession(ipv6Config).should.be.fulfilled;
            });

            it('should not connect if the credentials are invalid', () => {
                const invalidConfig = Object.assign({}, config, {
                    dbUser: 'invalid user',
                    dbPassword: 'invalid password'
                });

                return mysqlx.getNodeSession(invalidConfig).should.be.rejected;
            });
        });

        context('using a RFC-3986 URI', () => {
            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
                const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port };

                return mysqlx.getNodeSession(uri).then(result => {
                    expect(result).to.be.an.instanceof(BaseSession);
                    expect(result.inspect()).to.deep.equal(expected);
                });
            });
        });
    });

    context('server cluster abstraction', () => {
        context('using a configuration object', () => {
            it('should connect to the server in a new session', () => {
                return mysqlx.getSession(config).should.be.fulfilled;
            });

            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });

                return mysqlx.getSession(ipv6Config).should.be.fulfilled;
            });

            it('should not connect if the credentials are invalid', () => {
                const invalidConfig = Object.assign({}, config, {
                    dbUser: 'invalid user',
                    dbPassword: 'invalid password'
                });

                return mysqlx.getSession(invalidConfig).should.be.rejected;
            });
        });

        context('using a RFC-3986 URI', () => {
            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
                const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port };

                return mysqlx.getSession(uri).then(result => {
                    expect(result).to.be.an.instanceof(BaseSession);
                    expect(result.inspect()).to.deep.equal(expected);
                });
            });
        });
    });
});

