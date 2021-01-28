/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
    const baseConfig = { host: 'mysql-default', schema: undefined, socket: undefined };
    const waitForEndpointToBecomeAvailable = 5000; // (ms)
    const waitForEndpointToBecomeUnavailable = 2000; // (ms)

    context('when the server goes away', () => {
        afterEach('reset the service', function () {
            this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return fixtures.enableEndpoint(serverShutdownConfig.host, waitForEndpointToBecomeAvailable);
        });

        it('makes the session unusable for subsequent operations', function () {
            this.timeout(this.timeout() + waitForEndpointToBecomeUnavailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(serverShutdownConfig)
                .then(session => {
                    return fixtures.disableEndpoint(serverShutdownConfig.host, waitForEndpointToBecomeUnavailable)
                        .then(() => session.sql('SELECT 1').execute());
                })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_SERVER_SHUTDOWN));
        });

        it('logs the server shutdown notice', function () {
            this.timeout(this.timeout() + waitForEndpointToBecomeUnavailable);

            const serverShutdownConfig = Object.assign({}, config, baseConfig);
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'shutdown.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitForEndpointToBecomeUnavailable], { config: serverShutdownConfig })
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

        context('on a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const serverShutdownConfig = Object.assign({}, config, baseConfig);

                // we expect the error to not be related to queueTimeout, so we want it to be a factor
                pool = mysqlx.getClient(serverShutdownConfig, { pooling: { maxSize: 2, queueTimeout: waitForEndpointToBecomeAvailable } });
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('releases the connection even if maxIdleTime is not exceeded', () => {
                const serverShutdownConfig = Object.assign({}, config, baseConfig);

                return Promise.all([pool.getSession(), pool.getSession()])
                    .then(() => {
                        return fixtures.disableEndpoint(serverShutdownConfig.host, waitForEndpointToBecomeUnavailable);
                    })
                    .then(() => {
                        // by this point, the connections should have been released
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.code).to.equal('ECONNREFUSED');
                        expect(err.address).to.equal(serverShutdownConfig.host);
                        expect(err.port).to.equal(serverShutdownConfig.port);
                    });
            });
        });
    });

    context('when the client cannot connect to the server', () => {
        context('the connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const connectionReleaseConfig = Object.assign({}, config, baseConfig);

                // we expect the error to not be related to queueTimeout, so we want it to be a factor
                pool = mysqlx.getClient(connectionReleaseConfig, { pooling: { maxSize: 2, queueTimeout: waitForEndpointToBecomeAvailable } });
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('releases the connection for subsequent attempts', () => {
                const connectionReleaseConfig = Object.assign({}, config, baseConfig);

                return fixtures.disableEndpoint(connectionReleaseConfig.host, waitForEndpointToBecomeUnavailable)
                    .then(() => {
                        // the first attempt should fail
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(() => {
                        return fixtures.enableEndpoint(connectionReleaseConfig.host, waitForEndpointToBecomeAvailable)
                            .then(() => {
                                // the second attempt should be successful
                                return pool.getSession();
                            });
                    });
            });
        });
    });
});
