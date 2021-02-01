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

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../..');
const tls = require('tls');

describe('TLS version negotiation', () => {
    context('server with support for the most secure TLS versions only', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1.1 and TLSv1.2
        const baseConfig = { host: 'mysql-with-latest-tls-versions', schema: 'performance_schema', socket: undefined };

        it('picks the highest version supported by both the client and the server by default', () => {
            const expected = 'TLSv1.2';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application if it is supported by the server', () => {
            const versions = ['TLSv1', 'TLSv1.1'];
            const expected = versions[1];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('negotiates to any one version provided by the application that is supported by the server when the highest is not supported', () => {
            const versions = ['TLSv1.2', 'TLSv1.3'];
            const expected = versions[0];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('fails to negotiate if no version provided by the application is not supported by the server', () => {
            const versions = ['TLSv1'];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(() => expect.fail())
                .catch(err => {
                    // ECONNRESET: socket hang up
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });
    });

    context('server with support for the least secure TLS versions only', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1 and TLSv1.1
        const baseConfig = { host: 'mysql-with-oldest-tls-versions', schema: 'performance_schema', socket: undefined };

        it('picks the highest version supported in the server by default if the client supports a version range', function () {
            if (!tls.DEFAULT_MAX_VERSION || !tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const expected = 'TLSv1.1';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application that is also supported in the server if the client supports a version range', function () {
            if (!tls.DEFAULT_MAX_VERSION || !tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1.1', 'TLSv1.2'];
            const expected = versions[0];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application if is also supported in the server if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1', 'TLSv1.1'];
            const expected = versions[1];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('fails to negotiate by default if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(() => expect.fail())
                .catch(err => {
                    // OpenSSL: wrong version number
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });

        it('fails to negotiate a lower version provided by the application if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1.1', 'TLSv1.2'];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(() => expect.fail())
                .catch(err => {
                    // OpenSSL: wrong version number
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });
    });
});
