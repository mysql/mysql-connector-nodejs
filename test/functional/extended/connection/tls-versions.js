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

/* eslint-env node, mocha */

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const mysqlx = require('../../../..');
const tls = require('tls');

describe('connecting with specific TLS versions', () => {
    context('when TLSv1.3 is enabled in the server', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1.2 and TLSv1.3
        const baseConfig = { host: 'mysql', schema: 'performance_schema', socket: undefined };

        context('and is supported by the client', () => {
            it('picks TLSv1.3 by default', function () {
                // runs on Node.js >= 12.0.0
                if (!tls.DEFAULT_MAX_VERSION || tls.DEFAULT_MAX_VERSION === 'TLSv1.2') {
                    return this.skip();
                }

                const expected = 'TLSv1.3';

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });

            it('picks TLSv1.3 when it is provided by the application', function () {
                // runs on Node.js >= 12.0.0
                if (!tls.DEFAULT_MAX_VERSION || tls.DEFAULT_MAX_VERSION === 'TLSv1.2') {
                    return this.skip();
                }

                const versions = ['TLSv1.2', 'TLSv1.3'];
                const expected = versions[1];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('and is not supported by the client', () => {
            it('picks TLSv1.2 by default', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

                const expected = 'TLSv1.2';

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });

            it('picks TLSv1.2 when it is provided by the application', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

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

            it('fails to connect when the application requires TLSv1.3', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

                const versions = ['TLSv1.3'];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                    });
            });
        });
    });

    context('when TLSv1.3 is not enabled in the server', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1.2 only
        const baseConfig = { host: 'mysql-without-tlsv1_3', schema: 'performance_schema', socket: undefined };

        context('and is supported by the client', () => {
            it('picks TLSv1.2 by default', function () {
                // runs on Node.js >= 12.0.0
                if (!tls.DEFAULT_MAX_VERSION || tls.DEFAULT_MAX_VERSION === 'TLSv1.2') {
                    return this.skip();
                }

                const expected = 'TLSv1.2';

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });

            it('picks TLSv1.2 when it is provided by the application', function () {
                // runs on Node.js >= 12.0.0
                if (!tls.DEFAULT_MAX_VERSION || tls.DEFAULT_MAX_VERSION === 'TLSv1.2') {
                    return this.skip();
                }

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

            it('fails to connect when the application requires TLSv1.3', function () {
                // runs on Node.js >= 12.0.0
                if (!tls.DEFAULT_MAX_VERSION || tls.DEFAULT_MAX_VERSION === 'TLSv1.2') {
                    return this.skip();
                }

                const versions = ['TLSv1.3'];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                    .then(() => expect.fail())
                    .catch(err => {
                        // OpenSSL: wrong version number
                        // The error message varies depending on the Node.js
                        // version, so we should just check the error is
                        // not the one being forced by the test itself
                        expect(err.message).to.not.equal('expect.fail()');
                    });
            });
        });

        context('and is not supported by the client', () => {
            it('picks TLSv1.2 by default', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

                const expected = 'TLSv1.2';

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });

            it('picks TLSv1.2 when it is provided by the application', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

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

            it('fails to connect when the application requires TLSv1.3', function () {
                // runs on Node.js < 12.0.0
                if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                    return this.skip();
                }

                const versions = ['TLSv1.3'];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                    });
            });
        });
    });
});
