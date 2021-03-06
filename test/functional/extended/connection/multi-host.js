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
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.message).to.equal('Unable to connect to any of the target hosts.');
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
                            .then(() => expect.fail())
                            .catch(err => {
                                expect(err.message).to.equal('Unable to connect to any of the target hosts.');
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
        const multihostConfig = { endpoints: [{ host: 'mysql-primary', priority: 99 }, { host: 'mysql-secondary1', priority: 98 }, { host: 'mysql-secondary2', priority: 97 }] };

        const waitForEndpointToBecomeAvailable = 5000; // (ms)
        const waitForEndpointToBecomeUnavailable = 2000; // (ms)
        const waitForEndpointToBecomeActive = 20000 + 1000; // (ms) must exceed the value defined by MULTIHOST_RETRY on lib/DevAPI/Session.js

        afterEach('reset all services', function () {
            const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

            this.timeout(this.timeout() + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length);

            return Promise.all(failoverConfig.endpoints.map(e => fixtures.enableEndpoint(e.host, waitForEndpointToBecomeAvailable)));
        });

        context('using standalone sessions', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

            context('when the endpoint with the highest priority is unavailable', () => {
                it('connects to the next available endpoint with the highest priority', function () {
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForEndpointToBecomeUnavailable * failoverConfig.endpoints.length + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length);

                    return mysqlx.getSession(failoverConfig)
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-primary', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-secondary1', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary2');
                            return session.close();
                        });
                });
            });

            context('when an endpoint with higher priority becomes available', () => {
                it('always connects to that endpoint', function () {
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForEndpointToBecomeUnavailable * failoverConfig.endpoints.length + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length);

                    return fixtures.disableEndpoint('mysql-primary', waitForEndpointToBecomeUnavailable)
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.enableEndpoint('mysql-primary', waitForEndpointToBecomeAvailable);
                        })
                        .then(() => {
                            return mysqlx.getSession(failoverConfig);
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-primary');
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

            context('when the endpoint with the highest priority is unavailable and does not become available soon enough', () => {
                it('fails over to the next available endpoint with the highest priority', function () {
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForEndpointToBecomeUnavailable * failoverConfig.endpoints.length + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length);

                    return pool.getSession()
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-primary', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.enableEndpoint('mysql-primary', waitForEndpointToBecomeAvailable);
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-secondary1', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary2');
                            return session.close();
                        });
                });
            });

            context('when the endpoint with the highest priority is unvailable but becomes available soon enough', () => {
                it('connects to that endpoint if the current endpoint is not available anymore', function () {
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForEndpointToBecomeUnavailable * failoverConfig.endpoints.length + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length + waitForEndpointToBecomeActive * failoverConfig.endpoints.length);

                    return pool.getSession()
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-primary');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-primary', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.enableEndpoint('mysql-primary', waitForEndpointToBecomeAvailable);
                        })
                        .then(() => {
                            return fixtures.disableEndpoint('mysql-secondary1', waitForEndpointToBecomeUnavailable);
                        })
                        .then(() => {
                            return new Promise(resolve => setTimeout(resolve, waitForEndpointToBecomeActive));
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-primary');
                            return session.close();
                        });
                });
            });

            context('when an endpoint with higher priority becomes available', () => {
                it('does not connect to that endpoint if the current one is still available', function () {
                    this.timeout(this.timeout() * failoverConfig.endpoints.length + waitForEndpointToBecomeUnavailable * failoverConfig.endpoints.length + waitForEndpointToBecomeAvailable * failoverConfig.endpoints.length + waitForEndpointToBecomeActive * failoverConfig.endpoints.length);

                    return fixtures.disableEndpoint('mysql-primary', waitForEndpointToBecomeUnavailable)
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        })
                        .then(() => {
                            return fixtures.enableEndpoint('mysql-primary', waitForEndpointToBecomeAvailable);
                        })
                        .then(() => {
                            return new Promise(resolve => setTimeout(resolve, waitForEndpointToBecomeActive));
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().host).to.equal('mysql-secondary1');
                            return session.close();
                        });
                });
            });
        });
    });

    context('when the endpoint used by the current connection becomes unvailable', () => {
        const multihostConfig = { endpoints: [{ host: 'mysql-primary' }, { host: 'mysql-secondary1' }] };

        context('using a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const failoverConfig = Object.assign({}, config, baseConfig, multihostConfig);

                pool = mysqlx.getClient(failoverConfig);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('switches to any other availabe endpoint as soon as the server starts to shutdown', () => {
                const waitForServerNotification = 1000;

                return pool.getSession()
                    .then(session1 => {
                        // we should not wait for the server to shutdown
                        // however, we should wait a bit to ensure the server notification is sent
                        return fixtures.disableEndpoint(session1.inspect().host, waitForServerNotification)
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
        const multihostConfig = { endpoints: [{ host: 'mysql-primary', priority: 100 }, { host: 'mysql-secondary1', priority: 90 }] };

        const waitForEndpointToChangeState = 5000; // (ms)
        const waitForEndpointToBecomeAvailable = 20000 + 1000; // (ms) must exceed the value defined by MULTIHOST_RETRY on lib/DevAPI/Session.js

        beforeEach('make the endpoints unvailable', function () {
            this.timeout(this.timeout() + waitForEndpointToChangeState * multihostConfig.endpoints.length);

            return Promise.all(multihostConfig.endpoints.map(e => fixtures.disableEndpoint(e.host, waitForEndpointToChangeState)));
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

                this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

                return pool.getSession()
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return fixtures.enableEndpoint(endpoint.host, waitForEndpointToBecomeAvailable)
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

                this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

                return pool.getSession()
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return fixtures.enableEndpoint(endpoint.host, waitForEndpointToBecomeAvailable)
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
                const timeout = waitForEndpointToBecomeAvailable + 2 * waitForEndpointToChangeState;

                this.timeout(this.timeout() + timeout);

                return pool.getSession()
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.errno).to.equal(4001);
                        return Promise.all(endpoints.map(e => fixtures.enableEndpoint(e.host, timeout)))
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
