/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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
const services = require('../../../fixtures/consul/config.json').services;

describe('connecting to the MySQL server using DNS SRV', () => {
    // host uses the lookup rules defined at https://www.consul.io/docs/agent/dns.html#service-lookups
    const baseConfig = { host: '_mysqlx._tcp.service.consul', port: undefined, schema: undefined, socket: undefined };

    context('when all endpoints are available', () => {
        it('connects to the endpoint with highest weight', () => {
            const srvConfig = Object.assign({}, config, baseConfig);
            const endpoint = fixtures.sortServicesByWeight(services)[0];

            return mysqlx.getSession(`mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`)
                .then(session => {
                    return fixtures.getIPv4Address(session.inspect().host)
                        .then(address => {
                            expect(address).to.equal(endpoint.address);
                            return session.close();
                        });
                });
        });
    });

    context('when the endpoint with the heighest weight is not available', () => {
        afterEach('reset all services', () => {
            return Promise.all(services.map(service => fixtures.deregisterService(service.id)))
                .then(() => Promise.all(services.map(service => fixtures.registerService(service))));
        });

        context('using standalone sessions', () => {
            it('connects to the next most appropriate endpoint', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: true });
                const endpoints = fixtures.sortServicesByWeight(services);

                return mysqlx.getSession(srvConfig)
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host)
                            .then(address => {
                                expect(address).to.equal(endpoints[0].address);
                                return session.close();
                            });
                    })
                    .then(() => {
                        return fixtures.deregisterService(endpoints[0].id);
                    })
                    .then(() => {
                        return mysqlx.getSession(srvConfig);
                    })
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host)
                            .then(address => {
                                expect(address).to.equal(endpoints[1].address);
                                return session.close();
                            });
                    })
                    .then(() => {
                        return fixtures.registerService(endpoints[0]);
                    })
                    .then(() => {
                        return mysqlx.getSession(srvConfig);
                    })
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host)
                            .then(address => {
                                expect(address).to.equal(endpoints[0].address);
                                return session.close();
                            });
                    });
            });
        });

        context('using a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: true });

                pool = mysqlx.getClient(srvConfig);
            });

            afterEach('destroy pool', () => {
                return pool.close();
            });

            it('connects to the next most appropriate endpoint', () => {
                const endpoints = fixtures.sortServicesByWeight(services);

                return pool.getSession()
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host);
                    })
                    .then(address => {
                        expect(address).to.equal(endpoints[0].address);
                    })
                    .then(() => {
                        return fixtures.deregisterService(endpoints[0].id);
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host);
                    })
                    .then(address => {
                        expect(address).to.equal(endpoints[1].address);
                    })
                    .then(() => {
                        return fixtures.registerService(endpoints[0]);
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session => {
                        return fixtures.getIPv4Address(session.inspect().host);
                    })
                    .then(address => {
                        expect(address).to.equal(endpoints[0].address);
                    });
            });
        });
    });
});
