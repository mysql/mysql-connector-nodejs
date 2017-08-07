'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');
const os = require('os');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration authentication methods', () => {
    context('configuration object', () => {
        it('should allow sessions with a given authentication method', () => {
            const authOverrideConfig = Object.assign({}, config, { auth: 'MYSQL41', socket: undefined });

            return expect(mysqlx.getSession(authOverrideConfig)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    return session.close();
                });
        });

        it('should select a default authentication method for secure connections', () => {
            const secureConfig = Object.assign({}, config, { socket: undefined, ssl: true });

            return expect(mysqlx.getSession(secureConfig)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');

                    return session.close();
                });
        });

        it('should select a default authentication method for non-secure connections', () => {
            const insecureConfig = Object.assign({}, config, { socket: undefined, ssl: false });

            return expect(mysqlx.getSession(insecureConfig)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    return session.close();
                });
        });

        it('should select a default authentication method for local UNIX socket connections', function () {
            if (!config.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const localSocketConfig = Object.assign({}, config, { ssl: false });

            return expect(mysqlx.getSession(localSocketConfig)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');

                    return session.close();
                });
        });

        it('should fail to connect if the authentication method is not supported', () => {
            const invalidConfig = Object.assign({}, config, { auth: 'foobar' });

            return expect(mysqlx.getSession(invalidConfig)).to.be.rejectedWith('Authentication mechanism is not supported by the server');
        });
    });

    context('connection string', () => {
        it('should allow sessions with a given authentication method', () => {
            const authOverrideConfig = Object.assign({}, config, { auth: 'MYSQL41' });
            const uri = `mysqlx://${authOverrideConfig.dbUser}:${authOverrideConfig.dbPassword}@${authOverrideConfig.host}:${authOverrideConfig.port}/${authOverrideConfig.schema}?auth=${authOverrideConfig.auth}`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    return session.close();
                });
        });

        it('should select a default authentication method for secure connections', () => {
            const secureConfig = Object.assign({}, config, { ssl: true });
            const uri = `mysqlx://${secureConfig.dbUser}:${secureConfig.dbPassword}@${secureConfig.host}:${secureConfig.port}/${secureConfig.schema}?ssl-mode=REQUIRED`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');

                    return session.close();
                });
        });

        it('should select a default authentication method for non-secure connections', () => {
            const insecureConfig = Object.assign({}, config, { ssl: false });
            const uri = `mysqlx://${insecureConfig.dbUser}:${insecureConfig.dbPassword}@${insecureConfig.host}:${insecureConfig.port}/${insecureConfig.schema}?ssl-mode=DISABLED`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    return session.close();
                });
        });

        it('should select a default authentication method for local UNIX socket connections', function () {
            if (!config.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const localSocketConfig = Object.assign({}, config);
            const uri = `mysqlx://${localSocketConfig.dbUser}:${localSocketConfig.dbPassword}@(${localSocketConfig.socket})?ssl-mode=DISABLED`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');

                    return session.close();
                });
        });

        it('should select a default authentication method for insecure failover addresses', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]?ssl-mode=DISABLED`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');

                    return session.close();
                });
        });

        it('should select a default authentication method for secure failover addresses', () => {
            const failoverConfig = Object.assign({}, config);
            const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
            const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]?ssl-mode=REQUIRED`;

            return expect(mysqlx.getSession(uri)).to.be.fulfilled
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');

                    return session.close();
                });
        });

        it('should fail to connect if the authentication method is not supported', () => {
            const invalidConfig = Object.assign({}, config, { auth: 'foobar' });
            const uri = `mysqlx://${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}/${invalidConfig.schema}?auth=${invalidConfig.auth}`;

            return expect(mysqlx.getSession(uri)).to.be.rejectedWith('Authentication mechanism is not supported by the server');
        });
    });
});
