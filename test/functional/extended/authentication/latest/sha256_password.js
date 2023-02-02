/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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

const config = require('../../../../config');
const errors = require('../../../../../lib/constants/errors');
const expect = require('chai').expect;
const mysqlx = require('../../../../..');
const os = require('os');
const path = require('path');

describe('sha256_password authentication plugin on MySQL 8.0.15', () => {
    // mysql-8.0.15 service defined in $root/test/docker/docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.15', schema: undefined };
    const socket = path.join(os.tmpdir(), `${baseConfig.host}.sock`);

    // With the PLAIN and MYSQL41 authentication mechanisms, or without an
    // authentication mechanism, the behavior is the same for all MySQL 8.0
    // versions.
    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        it('fails over TCP with TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, tls: { enabled: true } });

            return mysqlx.getSession(authConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                });
        });

        it('fails over regular TLS', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket: undefined, tls: { enabled: false } });

            return mysqlx.getSession(authConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                });
        });

        it('fails over a Unix socket', () => {
            const authConfig = Object.assign({}, config, baseConfig, { auth, socket, tls: { enabled: false } });

            return mysqlx.getSession(authConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
                });
        });
    });
});
