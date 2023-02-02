/*
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
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
const disableService = require('../../../fixtures/dns/discovery/disableService');
const enableService = require('../../../fixtures/dns/discovery/enableService');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const resetServices = require('../../../fixtures/dns/discovery/resetServices');
const srv = require('../../../../lib/topology/dns-srv');
const services = require('../../../fixtures/dns/discovery/db.json');

describe('connecting to the MySQL server using DNS SRV', () => {
    const baseConfig = { host: '_mysqlx._tcp.example.com', port: undefined, schema: undefined, socket: undefined };
    const endpoints = srv.sort(services);

    context('when all endpoints are available', () => {
        it('connects to the endpoint with highest weight', async () => {
            const srvConfig = { ...config, ...baseConfig };

            const session = await mysqlx.getSession(`mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`);
            const address = await fixtures.getIPv4Address(session.inspect().host);
            expect(address).to.equal(endpoints[0].target);

            await session?.close();
        });
    });

    context('when the endpoint with the heighest weight is not available', () => {
        afterEach('reset all services', async () => {
            await resetServices();
        });

        context('using standalone sessions', () => {
            it('connects to the next most appropriate endpoint', async () => {
                const srvConfig = { ...config, ...baseConfig, resolveSrv: true };
                let session = await mysqlx.getSession(srvConfig);

                let address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[0].target);

                await session?.close();

                await disableService(endpoints[0].target);

                session = await mysqlx.getSession(srvConfig);
                address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[1].target);

                await session?.close();

                await enableService(endpoints[0].target);

                session = await mysqlx.getSession(srvConfig);
                address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[0].target);

                await session?.close();
            });
        });

        context('using a connection pool', () => {
            let pool;

            beforeEach('create pool', () => {
                const srvConfig = { ...config, ...baseConfig, resolveSrv: true };

                pool = mysqlx.getClient(srvConfig);
            });

            afterEach('destroy pool', async () => {
                await pool.close();
            });

            it('connects to the next most appropriate endpoint', async () => {
                let session = await pool.getSession();
                let address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[0].target);

                // disable the service that was previously used
                await disableService(endpoints[0].target);

                session = await pool.getSession();
                address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[1].target);

                // re-enable the service that has been previously disabled
                await enableService(endpoints[0].target);

                session = await pool.getSession();
                address = await fixtures.getIPv4Address(session.inspect().host);
                expect(address).to.equal(endpoints[0].target);
            });
        });
    });
});
