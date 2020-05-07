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
