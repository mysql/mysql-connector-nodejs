'use strict';

/* eslint-env node, mocha */

const config = require('../../test/properties');
const expect = require('chai').expect;
const mysqlx = require('../../');
const path = require('path');

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
            const error = `The server's X plugin version does not support SSL. Please refer to https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.`;

            return mysqlx.getSession(secureConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(error);
                });
        });
    });
});
