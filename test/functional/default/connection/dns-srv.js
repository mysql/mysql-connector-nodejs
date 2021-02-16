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
const dns = require('dns');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');

describe('connecting to the MySQL server using DNS SRV', () => {
    const baseConfig = { host: '_mysqlx._tcp.example.com', port: undefined, resolveSrv: true, schema: undefined };

    it('fails to connect when the property value in the connection options is not valid', () => {
        const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: 'foo' });

        return mysqlx.getSession(srvConfig)
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('SRV resolution can only be toggled using a boolean value (true or false).'));
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
            dns.setServers([`${fakeServer.address().address}:${fakeServer.address().port}`].concat(originalServers));
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
            dns.setServers([`${fakeServer.address().address}:${fakeServer.address().port}`].concat(originalServers));
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
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${srvConfig.host}.`));
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${srvConfig.host}.`));
        });
    });

    // These tests are a bit flaky. We need to make sure we are in control of
    // the DNS server as well.
    context('when there is no DNS server available', () => {
        it('fails to connect using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${srvConfig.host}.`));
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${srvConfig.host}.`));
        });
    });

    context('when a port is specified in the connection options', () => {
        it('fails to connect using a configuration object', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });

        it('fails to connect using a connection string', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}:${srvConfig.port}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });
    });

    context('when a Unix local socket path is specified as the hostname', () => {
        it('fails to connect using a configuration object', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });

        it('fails to connect using a connection string', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { host: undefined, port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@(${srvConfig.socket})`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });
    });

    context('when multiple endpoints are specified in the connection options', () => {
        context('with explicit priority', () => {
            it('fails to connect using a configuration object', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060, priority: 99 }, { host: baseConfig.host, port: 33061, priority: 100 }] });

                return mysqlx.getSession(srvConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
            });

            it('fails to connect using a connection string', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { port: 33060 });
                const hosts = [`${srvConfig.host}:${srvConfig.port + 1}`, `${srvConfig.host}:${srvConfig.port}`];
                const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
            });
        });

        context('without explicit priority', () => {
            it('fails to connect using a configuration object', () => {
                const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060 }, { host: baseConfig.host, port: 33061 }] });

                return mysqlx.getSession(srvConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
            });

            it('fails to connect using a connection string', () => {
                const srvConfig = Object.assign({}, config);
                const hosts = [`(address=${srvConfig.host}:${srvConfig.port}, priority=99), (address=${srvConfig.host}:${srvConfig.port}, priority=100)`];
                const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
            });
        });
    });
});
