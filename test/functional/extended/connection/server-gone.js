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

describe('handling disconnections originated by the server', () => {
    const baseConfig = { schema: undefined, socket: undefined };

    const waitForEndpointToBecomeAvailable = 30000; // (ms)
    const waitForEndpointToBecomeUnvailable = 10000; // (ms)

    afterEach('reset services', function () {
        const serverGoneConfig = Object.assign({}, config, baseConfig);

        this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

        return fixtures.enableEndpoint(serverGoneConfig.host);
    });

    it('triggers a proper error message', function () {
        const serverGoneConfig = Object.assign({}, config, baseConfig);

        this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

        return mysqlx.getSession(serverGoneConfig)
            .then(session => {
                return Promise.all([
                    session.sql(`SELECT SLEEP(${waitForEndpointToBecomeUnvailable * 2})`).execute(),
                    fixtures.disableEndpoint(serverGoneConfig.host, waitForEndpointToBecomeUnvailable)
                ]);
            })
            .then(() => expect.fail())
            .catch(err => {
                expect(err.message).to.equal('The server has gone away');
            });
    });
});
