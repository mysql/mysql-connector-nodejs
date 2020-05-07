'use strict';

/* eslint-env node, mocha */

const config = require('../../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../..');
const path = require('path');

describe('sha256_password authentication plugin on MySQL 8.0.15', () => {
    // server container (defined in docker.compose.yml)
    const baseConfig = { host: 'mysql-8.0.15-with-sha256-password-authentication-plugin', schema: undefined, socket: undefined };
    const socket = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'tmp', `${baseConfig.host}.sock`);

    // With the PLAIN and MYSQL41 authentication mechanisms, or without an
    // authentication mechanism, the behavior is the same for all MySQL 8.0
    // versions.
    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        it('fails over TCP with TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: true });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1045);
                });
        });

        it('fails over regular TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1045);
                });
        });

        it('fails over a UNIX socket', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1045);
                });
        });
    });
});
