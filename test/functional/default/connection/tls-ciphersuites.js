/* eslint-env node, mocha */

const config = require('../../../config');
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
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
        });

        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, baseConfig, { ssl: false, tls: { ciphersuites: ['foo', 'bar'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
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
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
        });

        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['foo', 'bar'] } });

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}?ssl-mode=DISABLED&tls-ciphersuites=[${tlsConfig.tls.ciphersuites.join(',')}]`)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
        });
    });
});
