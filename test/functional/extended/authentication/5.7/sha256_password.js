'use strict';

/* eslint-env node, mocha */

const config = require('../../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../../');
const path = require('path');

describe('sha256_password authentication plugin on MySQL 5.7', () => {
    // server container (defined in docker.compose.yml)
    const baseConfig = { host: 'mysql-5.7-with-sha256-password-authentication-plugin', schema: undefined };
    const socket = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'tmp', `${baseConfig.host}.sock`);

    context('connecting without an authentication mechanism', () => {
        it('succeeds over TCP with TLS using PLAIN', () => {
            const authConfig = Object.assign({}, config, baseConfig, { socket: undefined, ssl: true });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');
                    return session.close();
                });
        });

        it('succeeds over regular TCP using MYSQL41', () => {
            const authConfig = Object.assign({}, config, baseConfig, { socket: undefined, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal('MYSQL41');
                    return session.close();
                });
        });

        it('succeeds over a UNIX socket using PLAIN', () => {
            const authConfig = Object.assign({}, config, baseConfig, { socket, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal('PLAIN');
                    return session.close();
                });
        });
    });

    context('connecting with the MYSQL41 authentication mechanism', () => {
        const auth = 'MYSQL41';

        it('succeeds over TCP with TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: true });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal(auth);
                    return session.close();
                });
        });

        it('succeeds over regular TCP', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal(auth);
                    return session.close();
                });
        });

        it('succeeds over a UNIX socket', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal(auth);
                    return session.close();
                });
        });
    });

    context('connecting with the PLAIN authentication mechanism', () => {
        const auth = 'PLAIN';

        it('succeeds over TCP with TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: true });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal(auth);
                    return session.close();
                });
        });

        it('fails over regular TCP', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1251);
                });
        });

        it('succeeds over a UNIX socket', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(session => {
                    expect(session.inspect().auth).to.equal(auth);
                    return session.close();
                });
        });
    });

    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        it('fails over TCP with TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: true });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
        });

        it('fails over regular TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
        });

        it('fails over a UNIX socket', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket, ssl: false });

            return mysqlx.getSession(authConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('SHA256_MEMORY authentication is not supported by the server.'));
        });
    });
});
