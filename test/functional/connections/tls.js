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
});
