/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const errors = require('../../../../lib/constants/errors');
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('connection failures', () => {
    const baseConfig = { host: 'mysql', schema: undefined, socket: undefined };
    const waitForServerToBecomeAvailable = 5000; // (ms)

    context('when the endpoint becomes unavailable', () => {
        // The server is abruptly killed with "docker kill", so we should not
        // have to account for any kind of grace period. Even so, we will
        // give it a second to complete.
        const waitForServerToBecomeUnavailable = 1000; // (ms)

        afterEach('reset the service', function () {
            this.timeout(this.timeout() + waitForServerToBecomeAvailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return fixtures.restartServer(serverShutdownConfig.host, waitForServerToBecomeAvailable);
        });

        it('throws the error in the scope of an ongoing operation', function () {
            this.timeout(this.timeout() + waitForServerToBecomeAvailable);

            const serverGoneConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(serverGoneConfig)
                .then(session => {
                    return Promise.all([
                        session.sql(`SELECT SLEEP(${waitForServerToBecomeUnavailable * 2})`).execute(),
                        fixtures.killServer(serverGoneConfig.host, waitForServerToBecomeUnavailable)
                    ]);
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SERVER_GONE_AWAY);
                });
        });

        it('makes the session unusable for subsequent operations', function () {
            this.timeout(this.timeout() + waitForServerToBecomeUnavailable);

            const serverGoneConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(serverGoneConfig)
                .then(session => {
                    return fixtures.killServer(serverGoneConfig.host, waitForServerToBecomeUnavailable)
                        .then(() => {
                            return session.sql('SELECT 1').execute();
                        });
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_CONNECTION_CLOSED);
                });
        });
    });

    context('when the server shuts down', () => {
        // The server is gracefully stopped with "mysqladmin shutdow", and
        // sends a notification when it starts the grace period, which, in
        // this case, should not take more than 1 second, but we will give
        // it 2 seconds to complete.
        const waitForServerToShutDown = 2000; // (ms)

        afterEach('restart the server', function () {
            this.timeout(this.timeout() + waitForServerToBecomeAvailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return fixtures.restartServer(serverShutdownConfig.host, waitForServerToBecomeAvailable);
        });

        it('does not throw any error in the scope of an ongoing operation', function () {
            this.timeout(this.timeout() + waitForServerToBecomeAvailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(serverShutdownConfig)
                .then(session => {
                    return Promise.all([
                        session.sql(`SELECT SLEEP(${waitForServerToShutDown * 2})`).execute(),
                        fixtures.stopServer(serverShutdownConfig.host, waitForServerToShutDown)
                    ]);
                });
        });

        it('makes the session unusable for subsequent operations', function () {
            this.timeout(this.timeout() + waitForServerToShutDown);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(serverShutdownConfig)
                .then(session => {
                    return fixtures.stopServer(serverShutdownConfig.host, waitForServerToShutDown + 1000)
                        .then(() => {
                            return session.sql('SELECT 1').execute();
                        });
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_SERVER_SHUTDOWN);
                });
        });

        it('logs the server shutdown notice', function () {
            this.timeout(this.timeout() + waitForServerToShutDown);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'shutdown.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitForServerToShutDown], { config: serverShutdownConfig })
                .then(proc => {
                    // it should contain other notices
                    expect(proc.logs).to.be.an('array').and.have.length.above(0);
                    // but the shutdown notice should be the last in the list
                    const shutdownNotice = proc.logs[proc.logs.length - 1];
                    expect(shutdownNotice).to.contain.keys('type', 'scope', 'payload');
                    expect(shutdownNotice.type).to.equal('WARNING');
                    expect(shutdownNotice.scope).to.equal('GLOBAL');
                    expect(shutdownNotice.payload).to.contain.keys('level', 'code', 'msg');
                    expect(shutdownNotice.payload.level).to.equal('ERROR');
                    expect(shutdownNotice.payload.code).to.equal(1053);
                    expect(shutdownNotice.payload.msg).to.equal('Server shutdown in progress');
                });
        });

        context('a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const serverShutdownConfig = Object.assign({}, config, baseConfig);

                // we expect the error to not be related to queueTimeout, so we want it to be a factor
                pool = mysqlx.getClient(serverShutdownConfig, { pooling: { maxSize: 2, queueTimeout: waitForServerToBecomeAvailable } });
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('releases the connection even if maxIdleTime is not exceeded', () => {
                const serverShutdownConfig = Object.assign({}, config, baseConfig);

                return Promise.all([pool.getSession(), pool.getSession()])
                    .then(() => {
                        return fixtures.stopServer(serverShutdownConfig.host, waitForServerToShutDown);
                    })
                    .then(() => {
                        // by this point, the connections should have been released
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return fixtures.getIPv4Address(serverShutdownConfig.host)
                            .then(address => {
                                expect(err.code).to.equal('ECONNREFUSED');
                                expect(err.address).to.equal(address);
                                expect(err.port).to.equal(serverShutdownConfig.port);
                            });
                    });
            });
        });
    });

    context('when the client cannot connect to the server', () => {
        // The server is abruptly killed with "docker kill", so we should not
        // have to account for any kind of grace period. Even so, we will
        // give it a second to complete.
        const waitForServerToBecomeUnavailable = 1000; // (ms)

        context('a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const connectionReleaseConfig = Object.assign({}, config, baseConfig);

                // we expect the error to not be related to queueTimeout, so we want it to be a factor
                pool = mysqlx.getClient(connectionReleaseConfig, { pooling: { maxSize: 2, queueTimeout: waitForServerToBecomeAvailable } });
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('releases the connection for subsequent attempts', () => {
                const connectionReleaseConfig = Object.assign({}, config, baseConfig);

                return fixtures.stopServer(connectionReleaseConfig.host, waitForServerToBecomeUnavailable)
                    .then(() => {
                        // the first attempt should fail
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(() => {
                        return fixtures.restartServer(connectionReleaseConfig.host, waitForServerToBecomeAvailable)
                            .then(() => {
                                // the second attempt should be successful
                                return pool.getSession();
                            });
                    });
            });
        });
    });
});
