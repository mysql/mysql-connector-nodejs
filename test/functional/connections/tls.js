'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');
const tls = require('tls');

describe('TLS configuration', () => {
    const baseConfig = Object.assign({}, config, { schema: 'performance_schema', socket: undefined });

    context('version negotiation', () => {
        context('configuration object', () => {
            it('fails to connect if TLS versions are provided by the application for an insecure connection', () => {
                const invalidConfig = Object.assign({}, baseConfig, { ssl: false, tls: { versions: ['TLSv1.1', 'TLSv1.2'] } });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
            });

            it('fails to connect if the TLS versions list is empty', () => {
                const invalidConfig = Object.assign({}, baseConfig, { tls: { versions: [] } });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
            });

            it('fails to connect if any TLS version provided by the application is not valid', () => {
                const invalidConfig = Object.assign({}, baseConfig, { tls: { versions: ['TLSv1.2', 'foo'] } });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('"foo" is not a valid TLS protocol version. Should be one of TLSv1, TLSv1.1, TLSv1.2, TLSv1.3.'));
            });

            it('fails to connect if no valid TLS version provided by the application is supported by the client', function () {
                // runs on Node.js <= 12.0.0
                if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                    return this.skip();
                }

                const invalidConfig = Object.assign({}, baseConfig, { tls: { versions: ['TLSv1.3'] } });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
            });

            it('negotiatates to the highest client-supported version that the server also supports if none is provided', function () {
                // runs on Node.js <= 12.0.0
                if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                    return this.skip();
                }

                const expected = 'TLSv1.2';

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { ssl: true }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('connection string', () => {
            it('fails to connect if TLS versions are provided by the application for an insecure connection', () => {
                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}?ssl-mode=DISABLED&tls-versions=[TLSv1.1,TLSv1.2]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
            });

            it('fails to connect if the TLS versions list is empty', () => {
                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}?tls-versions=[]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
            });

            it('fails to connect if any TLS version provided by the application is not valid', () => {
                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}?tls-versions=[TLSv1.2,foo]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('"foo" is not a valid TLS protocol version. Should be one of TLSv1, TLSv1.1, TLSv1.2, TLSv1.3.'));
            });

            it('fails to connect if no valid TLS version provided by the application is supported by the client', function () {
                // runs on Node.js <= 12.0.0
                if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                    return this.skip();
                }

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}?tls-versions=[TLSv1.3]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
            });

            it('negotiatates to the highest client-supported version that the server also supports if none is provided', function () {
                // runs on Node.js <= 12.0.0
                if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                    return this.skip();
                }

                const expected = 'TLSv1.2';

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}`)
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });
    });

    context('ciphersuites', () => {
        // Selection rules:
        // 1. RSA is preferred over ECDSA
        // 2. PFS ciphersuites are preferred, with ECDHE first, then DHE
        // 3. GCM modes are preferred
        // 4. SHA-2 signature is preferred to SHA-1 (deprecated) in ciphers and certificates (For SHA-1 root certificates exception, please see Root certificates)
        // 5. AES 128 is preferred to AES 256 because it provides adequate security in TLS context and is really fast

        context('configuration object', () => {
            it('picks the appropriate default cipher for the given TLS protocol version when no ciphersuites are provided', () => {
                const versions = ['TLSv1.2'];
                const expected = ['ECDHE-RSA-AES128-GCM-SHA256', 'DHE-RSA-AES128-GCM-SHA256'];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { versions } }))
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

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { ciphersuites, versions } }))
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

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { ciphersuites, versions } }))
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[2] OpenSSL name
                            .then(() => session.close());
                    });
            });

            it('fails when all the provided ciphersuites are unacceptable', () => {
                const ciphersuites = ['TLS_ECDHE_RSA_WITH_NULL_SHA', 'TLS_ECDHE_ECDSA_WITH_NULL_SHA'];

                return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { ciphersuites } }))
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
            });

            it('fails to connect if TLS ciphersuites are provided by the application for an insecure connection', () => {
                const invalidConfig = Object.assign({}, baseConfig, { ssl: false, tls: { ciphersuites: ['foo', 'bar'] } });

                return mysqlx.getSession(invalidConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
            });
        });

        context('connection string', () => {
            it('picks the appropriate default cipher for the given TLS protocol version when no ciphersuites are provided', () => {
                const versions = ['TLSv1.2'];
                const expected = ['ECDHE-RSA-AES128-GCM-SHA256', 'DHE-RSA-AES128-GCM-SHA256'];

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}?tls-versions=[${versions.join(',')}]`)
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

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}?tls-versions=[${versions.join(',')}]&tls-ciphersuites=[${ciphersuites.join(',')}]`)
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

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}?tls-versions=[${versions.join(',')}]&tls-ciphersuites=[${ciphersuites.join(',')}]`)
                    .then(session => {
                        return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_cipher'")
                            .execute()
                            .then(res => expect(res.fetchOne()[0]).to.be.oneOf(expected)) // matches ciphersuites[2] OpenSSL name
                            .then(() => session.close());
                    });
            });

            it('fails when all the provided ciphersuites are unacceptable', () => {
                const ciphersuites = ['TLS_ECDHE_RSA_WITH_NULL_SHA', 'TLS_ECDHE_ECDSA_WITH_NULL_SHA'];

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}?tls-ciphersuites=[${ciphersuites.join(',')}]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
            });

            it('fails to connect if TLS ciphersuites are provided by the application for an insecure connection', () => {
                const ciphersuites = ['foo', 'bar'];

                return mysqlx.getSession(`mysqlx://${baseConfig.dbUser}:${baseConfig.dbPassword}@${baseConfig.host}:${baseConfig.port}/${baseConfig.schema}?ssl-mode=DISABLED&tls-ciphersuites=[${ciphersuites.join(',')}]`)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
            });
        });
    });
});
