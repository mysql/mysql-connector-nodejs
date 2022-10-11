/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const dns = require('dns');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');
const util = require('util');

describe('connecting to the MySQL server using DNS SRV', () => {
    const baseConfig = { host: '_mysqlx._tcp.example.com', port: undefined, resolveSrv: true, schema: undefined };

    it('fails to connect when the property value in the connection options is not valid', () => {
        const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: 'foo' });

        return mysqlx.getSession(srvConfig)
            .then(() => {
                return expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
            });
    });

    context('when there are DNS SRV records for the given service definition', () => {
        let originalServers, fakeServer;

        const records = [{
            priority: 5,
            weight: 10,
            target: config.host,
            port: config.port + 1
        }, {
            // should pick this one
            priority: 5,
            weight: 20,
            target: config.host,
            port: config.port
        }, {
            priority: 0,
            weight: 5,
            target: config.host,
            port: config.port + 2
        }];

        beforeEach('setup fake DNS server in the current host', () => {
            return fixtures.getIPv4Address(os.hostname())
                .then(host => {
                    return fixtures.createRecordServer({ host, service: baseConfig.host, records });
                })
                .then(server => {
                    fakeServer = server;
                });
        });

        beforeEach('add fake server to list of servers to be used for DNS resolution', () => {
            // Save the original list of DNS servers to restore after the test.
            originalServers = dns.getServers();
            // Add the fake server endpoint to the list of DNS servers.
            const { address, port } = fakeServer.addresses().udp;
            dns.setServers([`${address}:${port}`].concat(originalServers));
        });

        afterEach('restore original list of DNS servers', () => {
            dns.setServers(originalServers);
        });

        afterEach('close fake DNS server', () => {
            return fakeServer.close();
        });

        it('connects to the most appropriate endpoint using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(session => session.close());
        });

        it('connects to the most appropriate endpoint using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(session => session.close());
        });
    });

    context('when there are no DNS SRV records for the given service definition', () => {
        let originalServers, fakeServer;

        beforeEach('setup fake DNS server in the current host', () => {
            return fixtures.getIPv4Address(os.hostname())
                .then(host => {
                    return fixtures.createRecordServer({ host, service: baseConfig.host, records: [] });
                })
                .then(server => {
                    fakeServer = server;
                });
        });

        beforeEach('add fake server to list of servers to be used for DNS resolution', () => {
            // Save the original list of DNS servers to restore after the test.
            originalServers = dns.getServers();
            // Add the fake server endpoint to the list of DNS servers.
            const { address, port } = fakeServer.addresses().udp;
            dns.setServers([`${address}:${port}`].concat(originalServers));
        });

        afterEach('restore original list of DNS servers', () => {
            dns.setServers(originalServers);
        });

        afterEach('close fake DNS server', () => {
            return fakeServer.close();
        });

        it('fails to connect using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, srvConfig.host));
                });
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, srvConfig.host));
                });
        });
    });

    context('when there is no DNS server available', () => {
        let originalServers;

        beforeEach('remove DNS servers', () => {
            originalServers = dns.getServers();
            dns.setServers([]);
        });

        afterEach('restore original list of DNS servers', () => {
            dns.setServers(originalServers);
        });

        it('fails to connect using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, srvConfig.host));
                });
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, srvConfig.host));
                });
        });
    });

    context('when a port is specified in the connection options', () => {
        it('fails to connect using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                });
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}:${srvConfig.port}`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                });
        });
    });

    context('when a Unix local socket path is specified as the hostname', () => {
        it('fails to connect using a configuration object', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            return mysqlx.getSession(srvConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                });
        });

        it('fails to connect using a connection string', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { host: undefined, port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@(${srvConfig.socket})`;

            return mysqlx.getSession(uri)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                });
        });
    });

    context('when multiple endpoints are specified in the connection options', () => {
        context('with explicit priority', () => {
            it('fails to connect using a configuration object', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060, priority: 99 }, { host: baseConfig.host, port: 33061, priority: 100 }] });

                return mysqlx.getSession(srvConfig)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                    });
            });

            it('fails to connect using a connection string', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { port: 33060 });
                const hosts = [`${srvConfig.host}:${srvConfig.port + 1}`, `${srvConfig.host}:${srvConfig.port}`];
                const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                    });
            });
        });

        context('without explicit priority', () => {
            it('fails to connect using a configuration object', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060 }, { host: baseConfig.host, port: 33061 }] });

                return mysqlx.getSession(srvConfig)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                    });
            });

            it('fails to connect using a connection string', () => {
                const srvConfig = Object.assign({}, config);
                const hosts = [`(address=${srvConfig.host}:${srvConfig.port}, priority=99), (address=${srvConfig.host}:${srvConfig.port}, priority=100)`];
                const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                    });
            });
        });
    });
});
