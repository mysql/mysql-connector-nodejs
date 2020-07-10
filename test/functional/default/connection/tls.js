'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('connecting with SSL/TLS', () => {
    const baseConfig = { host: config.host, password: config.password, port: config.port, schema: undefined, socket: undefined, user: config.user };

    context('using a configuration object', () => {
        it('succeeds and enables TLS by default', () => {
            const tlsConfig = Object.assign({}, baseConfig);

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', true);
                    return session.close();
                });
        });

        it('succeeds with TLS explicitly disabled', () => {
            const tlsConfig = Object.assign({}, baseConfig, { ssl: false });

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', false);
                    return session.close();
                });
        });
    });

    context('using a URI', () => {
        it('succeeds and enables TLS by default', () => {
            const tlsConfig = Object.assign({}, baseConfig);
            const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', true);
                    return session.close();
                });
        });

        it('succeeds with TLS explicitly disabled', () => {
            const tlsConfig = Object.assign({}, baseConfig);
            const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?ssl-mode=DISABLED`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', false);
                    return session.close();
                });
        });
    });

    context('when debug mode is enabled', () => {
        it('logs the tls setup request', () => {
            // TLS is only available over TCP connections
            // The socket should be null since JSON.stringify() removes undefined properties
            const scriptConfig = { socket: null };
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Connection.CapabilitiesSet', script, [JSON.stringify(scriptConfig)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(2);
                    expect(proc.logs[0]).to.contain.keys('capabilities');
                    expect(proc.logs[0].capabilities).to.contain.keys('capabilities');
                    expect(proc.logs[0].capabilities.capabilities).to.be.an('array').and.have.lengthOf(1);
                    expect(proc.logs[0].capabilities.capabilities[0].name).to.equal('tls');
                    expect(proc.logs[0].capabilities.capabilities[0].value).to.contain.keys('scalar');
                    expect(proc.logs[0].capabilities.capabilities[0].value.scalar).to.contain.keys('v_bool');
                    return expect(proc.logs[0].capabilities.capabilities[0].value.scalar.v_bool).to.be.true;
                });
        });
    });
});
