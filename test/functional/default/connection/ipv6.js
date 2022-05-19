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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');

describe('connecting to the MySQL server using IPv6', () => {
    let host;

    const baseConfig = { schema: undefined, socket: undefined };

    beforeEach('resolve IPv6 address', () => {
        return fixtures.getIPv6Address(config.host)
            .then(address => {
                host = address;
            });
    });

    it('succeeds using a configuration object when the host has IPv6 support', function () {
        const ipv6Config = Object.assign({}, config, baseConfig, { host });

        if (!ipv6Config.host) {
            return this.skip();
        }

        return mysqlx.getSession(ipv6Config)
            .then(session => {
                expect(session.inspect().host).to.equal(host);
                return session.close();
            });
    });

    it('succeeds using a URI when the host has IPv6 support', function () {
        const ipv6Config = Object.assign({}, config, baseConfig, { host });

        if (!ipv6Config.host) {
            return this.skip();
        }

        return mysqlx.getSession(`mysqlx://${ipv6Config.user}:${ipv6Config.password}@[${ipv6Config.host}]:${ipv6Config.port}`)
            .then(session => {
                expect(session.inspect().host).to.equal(host);
                return session.close();
            });
    });
});
