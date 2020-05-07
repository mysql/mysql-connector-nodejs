'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

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
});
