'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');

describe('connection failures', () => {
    const baseConfig = { schema: undefined };

    context('with an existing session', () => {
        const testTimeout = 1; // in seconds
        const originalTimeout = 28800; // in seconds

        context('created with TCP and TLS', () => {
            const tcpConfig = { socket: undefined, ssl: true };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('make the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);
                const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, testTimeout * 1000 * 2))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });
        });

        context('created with regular TCP', () => {
            const tcpConfig = { socket: undefined, ssl: false };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('make the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);
                const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, testTimeout * 1000 * 2))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });
        });

        context('created with a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, ssl: false };

            beforeEach('restrict the server connection timeout', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('make the session unusable for subsequent operations', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, testTimeout * 1000 * 2))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });
        });
    });
});
