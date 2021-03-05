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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

describe('connecting with a list of MySQL servers', () => {
    const baseConfig = { host: undefined, port: undefined, schema: undefined, socket: undefined };

    context('with pseudorandom-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port + 1 }, { host: config.host, port: config.port }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `${e.host}:${e.port}`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port + 1 }, { host: config.host, port: config.port + 2 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `${e.host}:${e.port}`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED);
                });
        });
    });

    context('with priority-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port, priority: 99 }, { host: config.host, port: config.port + 1, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port + 1, priority: 99 }, { host: config.host, port: config.port + 2, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED);
                });
        });

        it('fails if some hosts have priority and others do not', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 99 }, { host: config.host }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => !e.priority ? `(address=${e.host})` : `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_MIXED_CONNECTION_ENDPOINT_PRIORITY);
                });
        });

        it('fails to connect to the server if any address priority is out of bounds', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 100 }, { host: config.host, priority: 101 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_ENDPOINT_PRIORITY_RANGE);
                });
        });
    });
});
