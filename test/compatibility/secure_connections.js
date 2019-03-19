'use strict';

/* eslint-env node, mocha */

const config = require('../../test/properties');
const expect = require('chai').expect;
const mysqlx = require('../../');
const path = require('path');
const tls = require('tls');

describe('secure connections', () => {
    context('server with SSL/TLS support', () => {
        // port as defined in docker-compose.yml
        const baseConfig = { port: 33061, schema: undefined, socket: undefined };
        // Provide fake servername to avoid CN mismatch.
        const servername = 'MySQL_Server_nodejsmysqlxtest_Auto_Generated_Server_Certificate';

        // TODO(Rui): this test is validating a certificate signed by a Root CA using the Root CA itself.
        // The main reason is that there are some issues with CRLs not signed by the Root CA.
        // This is not really a common practice, so, in the near future, the test must be changed to use
        // a certificate signed by an intermediate CA using the CA chain.
        it('connects to the server if the server certificate was issued by the authority', () => {
            const ca = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'ca.pem');
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, servername } });

            return mysqlx.getSession(secureConfig)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', true);
                    return session.close();
                });
        });

        // TODO(Rui): this test is validating a certificate signed by the Root CA using an intermediate CA.
        // This will result in a different error from the expected one. So, in the near future, one must
        // make sure it uses a certificate signed by an intermediate CA (a different one maybe), which will
        // result in the expected error.
        it('fails to connect if the server certificate was not issued by the authority', () => {
            const ca = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'non-authoritative-ca.pem');
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, servername } });

            return mysqlx.getSession(secureConfig)
                .then(() => expect.fail())
                .catch(err => {
                    // FIXME(Rui): with an intermediate CA, the error code should be 'UNABLE_TO_GET_ISSUER_CERT'.
                    expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                });
        });

        it('connects to the server if the server certificate is not revoked', () => {
            const ca = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'ca.pem');
            const crl = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'empty-crl.pem');
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, crl, servername } });

            return mysqlx.getSession(secureConfig)
                .then(session => {
                    expect(session.inspect()).to.have.property('ssl', true);
                    return session.close();
                });
        });

        it('fails to connect if the server certificate is revoked', () => {
            const ca = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'ca.pem');
            const crl = path.join(__dirname, '..', 'fixtures', 'ssl', 'client', 'crl.pem');
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, crl, servername } });

            return mysqlx.getSession(secureConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.code).to.equal('CERT_REVOKED');
                });
        });
    });

    context('server without SSL/TLS support', () => {
        // port as defined in docker-compose.yml
        const baseConfig = { port: 33062, schema: undefined, socket: undefined };

        it('fails to connect if the server does not support SSL/TLS', () => {
            // Insecure server will be running on port 33061.
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true });
            const error = 'The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.';

            return mysqlx.getSession(secureConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(error);
                });
        });
    });

    context('server with support for the most secure TLS versions only', () => {
        // port as defined in docker-compose.yml
        // server supports TLSv1.1 and TLSv1.2
        const baseConfig = { port: 33066, schema: 'performance_schema', socket: undefined };

        it('negotiates to the highest version supported by both the client and the server by default', () => {
            const expected = 'TLSv1.2';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('negotiates to the highest version provided by the application if it is supported by the server', () => {
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
        // port as defined in docker-compose.yml
        // server supports TLSv1 and TLSv1.1
        const baseConfig = { port: 33067, schema: 'performance_schema', socket: undefined };

        it('negotiates to the highest version supported in the server by default if the client supports a version range', function () {
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

        it('negotiates to the highest version provided by the application that is also supported in the server if the client supports a version range', function () {
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

        it('negotiates to the highest version provided by the application if is also supported in the server if the client does not support a version range', function () {
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

    context('server with support for the default set of TLS versions', () => {
        // port as defined in docker-compose.yml
        // server supports TLSv1, TLSv1.1 and TLSv1.2
        const baseConfig = { port: 33068, schema: 'performance_schema', socket: undefined };

        it('negotiates to the highest application-provided version if that is supported by both the server and the client', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const versions = ['TLSv1', 'TLSv1.1', 'TLSv1.3'];
            const expected = 'TLSv1.1';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { ssl: true, tls: { versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });
    });
});
