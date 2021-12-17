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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const mysqlx = require('../../../..');

describe('connecting with a list of ciphersuites', () => {
    const baseConfig = { schema: 'performance_schema', socket: undefined };

    // Selection rules:
    // 1. RSA is preferred over ECDSA
    // 2. PFS ciphersuites are preferred, with ECDHE first, then DHE
    // 3. GCM modes are preferred
    // 4. SHA-2 signature is preferred to SHA-1 (deprecated) in ciphers and certificates (For SHA-1 root certificates exception, please see Root certificates)
    // 5. AES 128 is preferred to AES 256 because it provides adequate security in TLS context and is really fast

    context('using a configuration object', () => {
        it('picks the appropriate default cipher for the given TLS protocol version when no ciphersuites are provided', () => {
            const versions = ['TLSv1.2'];
            const expected = ['ECDHE-RSA-AES128-GCM-SHA256', 'DHE-RSA-AES128-GCM-SHA256'];

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions } });

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected))
                        .then(() => session.close());
                });
        });

        it('picks the appropriate deprecated cipher for the given TLS protocol version when all the provided ciphersuites are deprecated', () => {
            const versions = ['TLSv1.2'];
            // all the following are deprecated
            const ciphersuites = ['TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256', 'TLS_DHE_RSA_WITH_AES_128_CBC_SHA256'];
            const expected = ['ECDHE-RSA-AES128-SHA256', 'DHE-RSA-AES128-SHA256'];

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites, versions } });

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[1] OpenSSL name
                        .then(() => session.close());
                });
        });

        it('ignores unnacceptable or unknown ciphersuites if at least one of them is acceptable', () => {
            const versions = ['TLSv1.2'];
            const ciphersuites = [
                'TLS_ECDHE_RSA_WITH_NULL_SHA', // unacceptable
                'foo', // unknown
                'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', // acceptable
                'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384' // acceptable
            ];

            const expected = ['ECDHE-RSA-AES256-GCM-SHA384', 'DHE-RSA-AES256-GCM-SHA384'];

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites, versions } });

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[2] OpenSSL name
                        .then(() => session.close());
                });
        });

        it('fails when all the provided ciphersuites are unacceptable', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['TLS_ECDHE_RSA_WITH_NULL_SHA', 'TLS_ECDHE_ECDSA_WITH_NULL_SHA'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                });
        });
    });

    context('connection string', () => {
        it('picks the appropriate default cipher for the given TLS protocol version when no ciphersuites are provided', () => {
            const expected = ['ECDHE-RSA-AES128-GCM-SHA256', 'DHE-RSA-AES128-GCM-SHA256'];
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2'] } });

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}?tls-versions=[${tlsConfig.tls.versions.join(',')}]`)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected))
                        .then(() => session.close());
                });
        });

        it('picks the appropriate deprecated cipher for the given TLS protocol version when all the provided ciphersuites are deprecated', () => {
            const expected = ['ECDHE-RSA-AES128-SHA256', 'DHE-RSA-AES128-SHA256'];
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256', 'TLS_DHE_RSA_WITH_AES_128_CBC_SHA256'], versions: ['TLSv1.2'] } });

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}?tls-versions=[${tlsConfig.tls.versions.join(',')}]&tls-ciphersuites=[${tlsConfig.tls.ciphersuites.join(',')}]`)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[1] OpenSSL name
                        .then(() => session.close());
                });
        });

        it('ignores unnacceptable or unknown ciphersuites if at least one of them is acceptable', () => {
            const versions = ['TLSv1.2'];
            const ciphersuites = [
                'TLS_ECDHE_RSA_WITH_NULL_SHA', // unacceptable
                'foo', // unknown
                'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', // acceptable
                'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384' // acceptable
            ];

            const expected = ['ECDHE-RSA-AES256-GCM-SHA384', 'DHE-RSA-AES256-GCM-SHA384'];

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites, versions } });

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}?tls-versions=[${tlsConfig.tls.versions.join(',')}]&tls-ciphersuites=[${tlsConfig.tls.ciphersuites.join(',')}]`)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[2] OpenSSL name
                        .then(() => session.close());
                });
        });

        it('fails when all the provided ciphersuites are unacceptable', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['TLS_ECDHE_RSA_WITH_NULL_SHA', 'TLS_ECDHE_ECDSA_WITH_NULL_SHA'] } });

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}?tls-ciphersuites=[${tlsConfig.tls.ciphersuites.join(',')}]`)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                });
        });
    });
});
