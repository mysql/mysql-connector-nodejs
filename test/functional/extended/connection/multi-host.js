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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('connecting with a list of MySQL servers', () => {
    const baseConfig = { connectTimeout: 0, host: undefined, schema: undefined, port: undefined, socket: undefined };

    context('when the maximum number of X Plugin connections is reached', () => {
        const singleHostConfig = { endpoints: [{ host: 'mysql-single-x-plugin-connection', priority: 100 }] };

        context('for standalone sessions', () => {
            it('connects to the next available endpoint with the highest priority', function () {
                const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: 'mysql', priority: 99 }) });
                const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`;

                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return mysqlx.getSession(uri)
                    .then(session1 => {
                        expect(session1.inspect().host).to.equal('mysql-single-x-plugin-connection');
                        return mysqlx.getSession(uri)
                            .then(session2 => {
                                expect(session2.inspect().host).to.equal('mysql');
                                return Promise.all([session1.close(), session2.close()]);
                            });
                    });
            });

            it('fails to connect when no more endpoints are available', function () {
                const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: singleHostConfig.endpoints[0].host, priority: 99 }) });
                const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`;

                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return mysqlx.getSession(uri)
                    .then(session1 => {
                        expect(session1.inspect().host).to.equal('mysql-single-x-plugin-connection');
                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED);
                                return session1.close();
                            });
                    });
            });
        });

        context('for a connection pool', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: 'mysql', priority: 99 }) });

            let pool;

            beforeEach('create pool', () => {
                pool = mysqlx.getClient(`mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('connects to the next available endpoint with the highest priority', function () {
                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return pool.getSession()
                    .then(session => {
                        expect(session.inspect().host).to.equal('mysql-single-x-plugin-connection');
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session => {
                        expect(session.inspect().host).to.equal('mysql');
                    });
            });
        });
    });

    context('when the maximum number of connections of the MySQL server is reached', () => {
        const singleHostConfig = { endpoints: [{ host: 'mysql-single-connection', priority: 100 }] };

        // the server allows max_connections + 1, so we need an active session
        let session;

        beforeEach('create active session', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig);
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@${failoverConfig.endpoints[0].host}`;

            return mysqlx.getSession(uri)
                .then(s => {
                    session = s;
                });
        });

        afterEach('close active session', () => {
            return session.close();
        });

        context('for standalone sessions', () => {
            it('connects to the next available endpoint with the highest priority', function () {
                const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: 'mysql', priority: 99 }) });
                const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`;

                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return mysqlx.getSession(uri)
                    .then(session1 => {
                        expect(session1.inspect().host).to.equal('mysql-single-connection');
                        return mysqlx.getSession(uri)
                            .then(session2 => {
                                expect(session2.inspect().host).to.equal('mysql');
                                return Promise.all([session1.close(), session2.close()]);
                            });
                    });
            });

            it('fails to connect when no more endpoints are available', function () {
                const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: singleHostConfig.endpoints[0].host, priority: 99 }) });
                const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`;

                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return mysqlx.getSession(uri)
                    .then(session1 => {
                        expect(session1.inspect().host).to.equal('mysql-single-connection');
                        return mysqlx.getSession(uri)
                            .then(() => {
                                return expect.fail();
                            })
                            .catch(err => {
                                expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED);
                                return session1.close();
                            });
                    });
            });
        });

        context('for a connection pool', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, singleHostConfig, { endpoints: singleHostConfig.endpoints.concat({ host: 'mysql', priority: 99 }) });

            let pool;

            beforeEach('create pool', () => {
                pool = mysqlx.getClient(`mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(',')}]`);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('connects to the next available endpoint with the highest priority', function () {
                this.timeout(this.timeout() * failoverConfig.endpoints.length);

                return pool.getSession()
                    .then(session => {
                        expect(session.inspect().host).to.equal('mysql-single-connection');
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session => {
                        expect(session.inspect().host).to.equal('mysql');
                    });
            });
        });
    });

    context('when some endpoints in the list are not available', () => {
        const multihostConfig = { endpoints: [{ host: 'mysql-cluster-primary', priority: 99 }, { host: 'mysql-cluster-first-replica', priority: 98 }, { host: 'mysql-cluster-second-replica', priority: 97 }] };

        const waitForServerToBecomeAvailable = 8000; // (ms)
        const waitForServerToBecomeUnavailable = 2000; // (ms)
        const waitForServerToBecomeActive = 20000 + 1000; // (ms) must exceed the value defined by MULTIHOST_RETRY on lib/DevAPI/Session.js

        afterEach('reset all services', function () {
            const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

            this.timeout(this.timeout() + waitForServerToBecomeAvailable * failoverConfig.endpoints.length);

            return Promise.all(failoverConfig.endpoints.map(e => fixtures.restartServer(e.host, waitForServerToBecomeAvailable)));
        });

        context('using standalone sessions', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

            context('when the endpoint with the highest priority is unavailable', () => {
                it('connects to the next available endpoint with the highest priority', function () {
                    // Waits for two servers to be killed.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable * 2);

                    return mysqlx.getSession(failoverConfig)
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-first-replica', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-second-replica');
                            return session.close();
                        });
                });
            });

            context('when an endpoint with higher priority becomes available', () => {
                it('always connects to that endpoint', function () {
                    // Waits for one server to be killed and one to be restarted.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable + waitForServerToBecomeAvailable);

                    return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable)
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.restartServer('mysql-cluster-primary', waitForServerToBecomeAvailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        });
                });
            });
        });

        context('using a connection pool', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

            let pool;

            beforeEach('create pool', () => {
                pool = mysqlx.getClient(failoverConfig);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            context('when the endpoint with the highest priority is unavailable and does not become available', () => {
                it('fails over to the next available endpoint with the highest priority', function () {
                    // Waits for two servers to be killed.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable * 2);

                    return pool.getSession()
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-first-replica', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-second-replica');
                            return session.close();
                        });
                });
            });

            context('when the endpoint with the highest priority is unavailable and does not become available soon enough', () => {
                it('fails over to the next available endpoint with the highest priority', function () {
                    // Waits for two servers to be killed and one to be restarted.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable * 2 + waitForServerToBecomeAvailable);

                    return pool.getSession()
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            // We do not wait for the endpoint to become
                            // active, so it will should not be picked again.
                            return fixtures.restartServer('mysql-cluster-primary', waitForServerToBecomeAvailable);
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-first-replica', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-second-replica');
                            return session.close();
                        });
                });
            });

            context('when the endpoint with the highest priority is unvailable but becomes available soon enough', () => {
                it('connects to that endpoint if the current endpoint is not available anymore', function () {
                    // Waits for two servers to be killed and one to become active.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable * 2 + waitForServerToBecomeActive);

                    return pool.getSession()
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            // Even though the endpoint is available when the
                            // container starts, we need to wait for an
                            // additional fixed number of seconds defined by
                            // the connection to retry it.
                            return fixtures.restartServer('mysql-cluster-primary', waitForServerToBecomeActive);
                        })
                        .then(() => {
                            return fixtures.killServer('mysql-cluster-first-replica', waitForServerToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-primary');
                            return session.close();
                        });
                });
            });

            context('when an endpoint with higher priority becomes available', () => {
                it('does not connect to that endpoint if the current one is still available', function () {
                    // Waits for one server to be killed and one to be active.
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForServerToBecomeUnavailable + waitForServerToBecomeActive);

                    return fixtures.killServer('mysql-cluster-primary', waitForServerToBecomeUnavailable)
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        })
                        .then(() => {
                            // Even though the endpoint is available when the
                            // container starts, we need to wait for an
                            // additional fixed number of seconds defined by
                            // the connection to retry it.
                            return fixtures.restartServer('mysql-cluster-primary', waitForServerToBecomeActive);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-cluster-first-replica');
                            return session.close();
                        });
                });
            });
        });
    });

    context('when the endpoint used by the current connection becomes unvailable', () => {
        const multihostConfig = { endpoints: [{ host: 'mysql-cluster-primary' }, { host: 'mysql-cluster-first-replica' }] };

        context('using a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

                pool = mysqlx.getClient(failoverConfig);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('switches to any other available endpoint as soon as the server starts to shutdown', () => {
                // We should not wait for the server to shutdown.
                // However, we should wait a bit to ensure the server
                // notification is sent. Something below the value of
                // waitForServerToBecomeUnavailable.
                const waitForServerNotification = 1500;

                return pool.getSession()
                    .then(session1 => {
                        return fixtures.stopServer(session1.inspect().host, waitForServerNotification)
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session2 => {
                                expect(session2.inspect().host).to.not.equal(session1.inspect().host);
                            });
                    });
            });
        });
    });

    context('when no endpoint is available', () => {
        const multihostConfig = { endpoints: [{ host: 'mysql-cluster-primary', priority: 100 }, { host: 'mysql-cluster-first-replica', priority: 90 }] };

        const waitForServerToChangeState = 5000; // (ms)
        const waitForServerToBecomeActive = 20000 + 1000; // (ms) must exceed the value defined by MULTIHOST_RETRY on lib/DevAPI/Session.js

        beforeEach('make the endpoints unvailable', function () {
            this.timeout(this.timeout() + waitForServerToChangeState * multihostConfig.endpoints.length);

            return Promise.all(multihostConfig.endpoints.map(e => fixtures.killServer(e.host, waitForServerToChangeState)));
        });

        context('using a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

                pool = mysqlx.getClient(failoverConfig);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('fails to connect to any endpoint after a short time', function () {
                // enable any endpoint and wait for less than the time it takes
                // for it to become available
                const endpoint = multihostConfig.endpoints[Math.floor(Math.random() * multihostConfig.endpoints.length)];

                this.timeout(this.timeout() + waitForServerToChangeState);

                return pool.getSession()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return fixtures.restartServer(endpoint.host, waitForServerToChangeState)
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session => {
                                expect(session.inspect().host).to.equal(endpoint.host);
                            });
                    });
            });

            it('connects to the endpoint that becomes available first after some time', function () {
                // enable the endpoint with the lower priority and wait for less than
                // the time it takes for it to become available
                const endpoint = multihostConfig.endpoints[1];

                this.timeout(this.timeout() + waitForServerToBecomeActive);

                return pool.getSession()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return fixtures.restartServer(endpoint.host, waitForServerToBecomeActive)
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session => {
                                expect(session.inspect().host).to.equal(endpoint.host);
                            });
                    });
            });

            it('connects to the endpoint with highest priority that becomes available first after some time', function () {
                // enable all endpoints and wait for all of them to become available
                const endpoints = multihostConfig.endpoints;
                const timeout = waitForServerToBecomeActive + 2 * waitForServerToChangeState;

                this.timeout(this.timeout() + timeout);

                return pool.getSession()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return Promise.all(endpoints.map(e => fixtures.restartServer(e.host, timeout)))
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session => {
                                expect(session.inspect().host).to.equal(endpoints[0].host);
                            });
                    });
            });
        });
    });
});
