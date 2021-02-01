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

const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const path = require('path');

describe('connecting to the MySQL server in the right port', () => {
    it('logs the X Protocol greeting message', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

        return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
            .then(proc => {
                // there are other notices sent by the server, namely a LOCAL CLIENT_ID_ASSIGNED
                expect(proc.logs).to.have.length.above(0);
                // but, we are looking for the first one
                expect(proc.logs[0]).to.contain.keys(['type', 'scope']);
                expect(proc.logs[0].type).to.equal('SERVER_HELLO');
                expect(proc.logs[0].scope).to.equal('GLOBAL');
            });
    });
});
