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
const crypto = require('crypto');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

describe('connecting with a list of MySQL servers', () => {
    const baseConfig = { host: undefined, port: undefined, schema: undefined, socket: undefined };

    context('with pseudorandom-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, port: config.port }, { host: config.host, port: config.port }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `${e.host}:${e.port}`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}` }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}` }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => e.host).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                });
        });
    });

    context('with priority-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port, priority: 99 }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, port: config.port, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, priority: 99 }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                });
        });

        it('fails if some hosts have priority and others do not', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 99 }, { host: config.host }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => !e.priority ? `(address=${e.host})` : `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                    expect(err.errno).to.equal(4000);
                });
        });

        it('fails to connect to the server if any address priority is out of bounds', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 100 }, { host: config.host, priority: 101 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('The priorities must be between 0 and 100');
                    expect(err.errno).to.equal(4007);
                });
        });
    });
});
