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

describe('connecting with specific TLS versions', () => {
    const baseConfig = { schema: 'performance_schema', socket: undefined };

    context('using a configuration object', () => {
        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { ssl: false, tls: { versions: ['TLSv1.1', 'TLSv1.2'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
        });

        it('fails if list of TLS versions is empty', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: [] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
        });

        it('fails if some TLS version provided by the application is not valid', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2', 'foo'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('"foo" is not a valid TLS protocol version. Should be one of TLSv1, TLSv1.1, TLSv1.2, TLSv1.3.'));
        });

        it('fails if none of the TLS versions provided by the application are supported by the client', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.3'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
        });

        it('picks highest supported version in the client that the server also supports if none is provided', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.2';

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the client if that is supported by both the server and the client', function () {
            const versions = ['TLSv1', 'TLSv1.1', 'TLSv1.3'];
            const tlsConfig = Object.assign({}, config, baseConfig, { ssl: true, tls: { versions } });

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.1';

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });
    });

    context('using a connection string', () => {
        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?ssl-mode=DISABLED&tls-versions=[TLSv1.1,TLSv1.2]`)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Additional TLS options cannot be specified when TLS is disabled.'));
        });

        it('fails if the list of TLS versions is empty', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[]`)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
        });

        it('fails if some TLS version provided by the application is not valid', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[TLSv1.2,foo]`)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('"foo" is not a valid TLS protocol version. Should be one of TLSv1, TLSv1.1, TLSv1.2, TLSv1.3.'));
        });

        it('fails if none of the TLS versions provided by the application are supported by the client', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[TLSv1.3]`)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No supported TLS protocol version found in the provided list.'));
        });

        it('picks the highest client-supported version that the server also supports if none is provided', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.2';

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}`)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });
    });
});
