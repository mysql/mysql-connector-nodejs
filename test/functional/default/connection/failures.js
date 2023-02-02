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

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');
const path = require('path');
const qs = require('querystring');
const sqlExecute = require('../../../../lib/DevAPI/SqlExecute');
const tls = require('tls');
const util = require('util');

describe('connection failures', () => {
    const baseConfig = { schema: undefined };

    context('while creating a new session', () => {
        const failureConfig = { host: undefined, port: undefined, socket: undefined };

        context('using a standalone connection', () => {
            context('when the connection definition is not valid', () => {
                it('fails using something other then an object or string', () => {
                    return mysqlx.getSession(false)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.not.equal('expect.fail()');
                        });
                });

                it('fails using a null configuration object', () => {
                    return mysqlx.getSession(null)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.not.equal('expect.fail()');
                        });
                });

                it('fails using an empty string', () => {
                    return mysqlx.getSession('')
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.not.equal('expect.fail()');
                        });
                });
            });

            context('when the connection options are specified with a configuration object', () => {
                it('fails when the path to the CA file is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { ca: false } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH);
                        });
                });

                it('fails when the path to the CRL file is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { crl: false } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH);
                        });
                });

                it('fails when the list of TLS versions is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { versions: 'foo' } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, 'foo'));
                        });
                });

                it('fails when the list of TLS versions is empty', () => {
                    const emptyTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: [] } });

                    return mysqlx.getSession(emptyTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                        });
                });

                it('fails when the list does not contain any allowed TLS version', () => {
                    const nonAllowedTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { versions: ['foo', 'TLSv1.1'] } });

                    return mysqlx.getSession(nonAllowedTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1.1', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when the list contains only invalid TLS versions', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { versions: ['foo', 'bar'] } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when the list contains only insecure TLS versions', () => {
                    const insecureTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { versions: ['TLSv1', 'TLSv1.1'] } });

                    return mysqlx.getSession(insecureTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when all the TLS versions provided in the list are not supported by the client', function () {
                    // This test only makes sense on Node.js v10 (or lower).
                    if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                        return this.skip();
                    }

                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { versions: ['TLSv1.3'] } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                        });
                });

                it('fails when the list of ciphersuites is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { ciphersuites: 'foo' } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'foo'));
                        });
                });

                it('fails when the list of ciphersuites does not contain any valid one', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, failureConfig, { tls: { ciphersuites: ['foo'] } });

                    return mysqlx.getSession(invalidTLSConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                        });
                });

                it('fails when the connection timeout is not a number above or equal to 0', () => {
                    const invalidTimeoutConfig = Object.assign({}, config, baseConfig, failureConfig, { connectTimeout: 'foo1' });

                    return mysqlx.getSession(invalidTimeoutConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                        });
                });

                it('fails when the connection attributes are null/empty', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, failureConfig, { connectionAttributes: null });

                    return mysqlx.getSession(invalidAttributesConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                        });
                });

                it('fails when the connection attributes are badly specified', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, failureConfig, { connectionAttributes: ['foo', 'bar'] });

                    return mysqlx.getSession(invalidAttributesConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                        });
                });

                it('fails when the name of any connection attribute starts with "_"', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, failureConfig, { connectionAttributes: { _foo: 'bar' } });

                    return mysqlx.getSession(invalidAttributesConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                        });
                });

                it('fails when SRV resolution is badly configured', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: 'foo' });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying multiple hosts', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: true, endpoints: [{ host: 'foo' }, { host: 'bar' }] });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying a port', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: true, port: 33061 });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                        });
                });

                it('fails when enabling SRV resolution whist specifying a port using the list of endpoints', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: true, endpoints: [{ host: 'foo', port: 33062 }] });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying a socket', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: true, socket: '/path/to/socket' });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying a socket using the list of endpoints', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, failureConfig, { resolveSrv: true, endpoints: [{ socket: '/path/to/socket' }] });

                    return mysqlx.getSession(invalidSRVConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                        });
                });

                it('fails when the port is not a number between 0 and 65536', () => {
                    const invalidPortConfig = Object.assign({}, config, baseConfig, failureConfig, { port: -1 });

                    return mysqlx.getSession(invalidPortConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                        });
                });

                it('fails when a port in the list of endpoints is not a number between 0 and 65536', () => {
                    const invalidPortConfig = Object.assign({}, config, baseConfig, failureConfig, { endpoints: [{ port: 33060 }, { port: -1 }] });

                    return mysqlx.getSession(invalidPortConfig)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                        });
                });
            });

            context('when the connection options are specified with a connection string', () => {
                it('fails when certificate authority verification is enabled but the path to the certificate authority file is not provided', () => {
                    const tlsMode = 'VERIFY_CA';
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { enabled: true } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?ssl-mode=${tlsMode}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_CERTIFICATE_AUTHORITY_REQUIRED, tlsMode));
                        });
                });

                it('fails when hostname verification is enabled but the path to the certificate authority file is not provided', () => {
                    const tlsMode = 'VERIFY_IDENTITY';
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { enabled: true } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?ssl-mode=${tlsMode}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_CERTIFICATE_AUTHORITY_REQUIRED, tlsMode));
                        });
                });

                it('fails when the list of TLS versions is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: 'foo' } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=foo`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, 'foo'));
                        });
                });

                it('fails when the list of TLS versions is empty', () => {
                    const emptyTLSConfig = Object.assign({}, config, baseConfig);
                    const uri = `mysqlx://${emptyTLSConfig.user}:${emptyTLSConfig.password}@${emptyTLSConfig.host}:${emptyTLSConfig.port}?tls-versions=[]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                        });
                });

                it('fails when the list does not contain any allowed TLS version', () => {
                    const nonAllowedTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['foo', 'TLSv1.1'] } });
                    const uri = `mysqlx://${nonAllowedTLSConfig.user}:${nonAllowedTLSConfig.password}@${nonAllowedTLSConfig.host}:${nonAllowedTLSConfig.port}?tls-versions=[${nonAllowedTLSConfig.tls.versions.join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1.1', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when the list contains only invalid TLS versions', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['foo', 'bar'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when the list contains only insecure TLS versions', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1', 'TLSv1.1'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                        });
                });

                it('fails when all the TLS versions provided in the list are not supported by the client', function () {
                    // This test only makes sense on Node.js v10 (or lower).
                    if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MAX_VERSION !== 'TLSv1.2') {
                        return this.skip();
                    }

                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.3'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                        });
                });

                it('fails when the list of ciphersuites is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: 'foo' } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=${invalidTLSConfig.tls.ciphersuites}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'foo'));
                        });
                });

                it('fails when the list of ciphersuites does not contain any valid one', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['foo'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=[${invalidTLSConfig.tls.ciphersuites.join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                        });
                });

                it('fails when the connection timeout is not a number above or equal to 0', () => {
                    const invalidTimeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });
                    const uri = `mysqlx://${invalidTimeoutConfig.user}:${invalidTimeoutConfig.password}@${invalidTimeoutConfig.host}:${invalidTimeoutConfig.port}?connect-timeout=${invalidTimeoutConfig.connectTimeout}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                        });
                });

                it('fails when the connection attributes are badly specified', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: ['foo', 'bar'] });
                    const uri = `mysqlx://${invalidAttributesConfig.user}:${invalidAttributesConfig.password}@${invalidAttributesConfig.host}:${invalidAttributesConfig.port}?connection-attributes=${invalidAttributesConfig.connectionAttributes.join(',')}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                        });
                });

                it('fails when the name of any connection attribute starts with "_"', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { _foo: 'bar' } });
                    const uri = `mysqlx://${invalidAttributesConfig.user}:${invalidAttributesConfig.password}@${invalidAttributesConfig.host}:${invalidAttributesConfig.port}?connection-attributes=[${qs.stringify(invalidAttributesConfig.connectionAttributes)}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying multiple hosts', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, endpoints: [{ host: 'foo' }, { host: 'bar' }] });
                    const uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@[${invalidSRVConfig.endpoints.map(e => e.host).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying a port', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, port: 33061 });
                    const uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@${invalidSRVConfig.host}:${invalidSRVConfig.port}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                        });
                });

                it('fails when enabling SRV resolution whilst specifying a socket', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, socket: '/path/to/socket' });
                    const uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@${encodeURIComponent(invalidSRVConfig.socket)}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                        });
                });

                it('fails when the port is not a number between 0 and 65536', () => {
                    const invalidPortConfig = Object.assign({}, config, baseConfig, { port: -1 });
                    const uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@${invalidPortConfig.host}:${invalidPortConfig.port}`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                        });
                });

                it('fails when a port in the list of endpoints is not a number between 0 and 65536', () => {
                    const invalidPortConfig = Object.assign({}, config, baseConfig, failureConfig, { endpoints: [{ port: 33060 }, { port: -1 }] });
                    const uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@[${invalidPortConfig.endpoints.map(e => `${invalidPortConfig.host}:${e.port}`)}]`;

                    return mysqlx.getSession(uri)
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                        });
                });
            });
        });

        context('using a connection pool', () => {
            it('throws an error when unknown client options are provided', () => {
                const unknownClientOptions = { foo: 'bar' };

                expect(() => mysqlx.getClient({}, unknownClientOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, 'foo'));
            });

            it('throws an error when unknown pooling options are provided', () => {
                const unknownPoolingOptions = { pooling: { foo: 'bar' } };

                expect(() => mysqlx.getClient({}, unknownPoolingOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, 'pooling.foo'));
            });

            it('throws an error when invalid pooling option values are provided', () => {
                let unknownPoolingOptions = { pooling: { enabled: 'foo' } };

                expect(() => mysqlx.getClient({}, unknownPoolingOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.enabled', 'foo'));

                unknownPoolingOptions = { pooling: { maxIdleTime: -1 } };

                expect(() => mysqlx.getClient({}, unknownPoolingOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.maxIdleTime', -1));

                unknownPoolingOptions = { pooling: { maxSize: -1 } };

                expect(() => mysqlx.getClient({}, unknownPoolingOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.maxSize', -1));

                unknownPoolingOptions = { pooling: { maxSize: -1 } };

                expect(() => mysqlx.getClient({}, unknownPoolingOptions))
                    .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.maxSize', -1));
            });

            context('when the connection options are specified with a configuration object', () => {
                it('throws an error when the path to the CA file is badly specified', () => {
                    let invalidTLSConfig = { tls: { ca: false } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH);

                    invalidTLSConfig = { tls: { ca: [] } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH);
                });

                it('throws an error when the path to the CRL file is badly specified', () => {
                    let invalidTLSConfig = { tls: { crl: {} } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH);

                    invalidTLSConfig = { tls: { crl: 2 } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH);
                });

                it('throws an error when the list of TLS versions is badly specified', () => {
                    let invalidTLSConfig = { tls: { versions: {} } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, {}));

                    invalidTLSConfig = { tls: { versions: 'foo' } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, 'foo'));
                });

                it('throws an error when the list of TLS versions is empty', () => {
                    const emptyTLSConfig = { tls: { versions: [] } };

                    expect(() => mysqlx.getClient(emptyTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });

                it('throws an error when the list does not contain any allowed TLS version', () => {
                    const nonAllowedTLSConfig = { tls: { versions: ['foo', 'TLSv1'] } };

                    expect(() => mysqlx.getClient(nonAllowedTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when the list contains only invalid TLS versions', () => {
                    const invalidTLSConfig = { tls: { versions: ['foo', 'bar'] } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when the list contains only insecure TLS versions', () => {
                    const insecureTLSConfig = { tls: { versions: ['TLSv1', 'TLSv1.1'] } };

                    expect(() => mysqlx.getClient(insecureTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when all the TLS versions provided in the list are not supported by the client', function () {
                    if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                        return this.skip();
                    }

                    const invalidTLSConfig = { tls: { versions: ['TLSv1.3'] } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION));
                });

                it('throws an error when the list of ciphersuites is badly specified', () => {
                    let invalidTLSConfig = { tls: { ciphersuites: 'foo' } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'foo'));

                    invalidTLSConfig = { tls: { ciphersuites: {} } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, {}));

                    invalidTLSConfig = { tls: { ciphersuites: false } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'false'));
                });

                it('throws an error when the list of ciphersuites does not contain any valid one', () => {
                    const invalidTLSConfig = { tls: { ciphersuites: ['foo', 'bar'] } };

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                });

                it('throws an error when the connection timeout is not a number above or equal to 0', () => {
                    let invalidTimeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 'foo1' });

                    expect(() => mysqlx.getClient(invalidTimeoutConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);

                    invalidTimeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });

                    expect(() => mysqlx.getClient(invalidTimeoutConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                });

                it('throws an error when the connection attributes are badly specified', () => {
                    let invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: ['foo', 'bar'] });

                    expect(() => mysqlx.getClient(invalidAttributesConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);

                    invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: 'foo' });

                    expect(() => mysqlx.getClient(invalidAttributesConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);

                    invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: null });

                    expect(() => mysqlx.getClient(invalidAttributesConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                });

                it('throws an error when the name of any connection attribute starts with "_"', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { _foo: 'bar' } });

                    expect(() => mysqlx.getClient(invalidAttributesConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                });

                it('throws an error when SRV resolution is badly configured', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: 'foo' });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
                });

                it('throws an error when enabling SRV resolution whilst specifying multiple hosts', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, endpoints: [{ host: 'foo' }, { host: 'bar' }] });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                });

                it('throws an error when enabling SRV resolution whilst specifying a port', () => {
                    let invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, port: 33061 });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);

                    invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, endpoints: [{ host: 'foo', port: 33062 }] });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                });

                it('throws an error when enabling SRV resolution whilst specifying a socket', () => {
                    let invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, socket: '/path/to/socket', port: undefined });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);

                    invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, endpoints: [{ socket: '/path/to/socket' }] });

                    expect(() => mysqlx.getClient(invalidSRVConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                });

                it('throws an error when the port is not a number between 0 and 65536', () => {
                    let invalidPortConfig = Object.assign({}, config, baseConfig, { port: -1 });

                    expect(() => mysqlx.getClient(invalidPortConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);

                    invalidPortConfig = Object.assign({}, config, baseConfig, { port: 'foo' });

                    expect(() => mysqlx.getClient(invalidPortConfig))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                });
            });

            context('when the connection options are specified with a connection string', () => {
                it('throws an error when the list of TLS versions is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: {} } });
                    let uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=${JSON.stringify(invalidTLSConfig.tls.versions)}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, JSON.stringify({})));

                    invalidTLSConfig.tls.versions = 'foo';
                    uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=${invalidTLSConfig.tls.versions}`;

                    expect(() => mysqlx.getClient(invalidTLSConfig))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, 'foo'));
                });

                it('throws an error when the list of TLS versions is empty', () => {
                    const emptyTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: [] } });
                    const uri = `mysqlx://${emptyTLSConfig.user}:${emptyTLSConfig.password}@${emptyTLSConfig.host}:${emptyTLSConfig.port}?tls-versions=${JSON.stringify(emptyTLSConfig.tls.versions)}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });

                it('throws an error when the list does not contain any allowed TLS version', () => {
                    const nonAllowedTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['foo', 'TLSv1'] } });
                    const uri = `mysqlx://${nonAllowedTLSConfig.user}:${nonAllowedTLSConfig.password}@${nonAllowedTLSConfig.host}:${nonAllowedTLSConfig.port}?tls-versions=[${nonAllowedTLSConfig.tls.versions.join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when the list contains only invalid TLS versions', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['foo', 'bar'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when the list contains only insecure TLS versions', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1', 'TLSv1.1'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'TLSv1', 'TLSv1.2, TLSv1.3'));
                });

                it('throws an error when all the TLS versions provided in the list are not supported by the client', function () {
                    if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                        return this.skip();
                    }

                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.3'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-versions=[${invalidTLSConfig.tls.versions.join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION));
                });

                it('throws an error when the list of ciphersuites is badly specified', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: 'foo' } });
                    let uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=${invalidTLSConfig.tls.ciphersuites}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'foo'));

                    invalidTLSConfig.tls.ciphersuites = {};
                    uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=${JSON.stringify(invalidTLSConfig.tls.ciphersuites)}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, JSON.stringify({})));

                    invalidTLSConfig.tls.ciphersuites = false;
                    uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=${invalidTLSConfig.tls.ciphersuites}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, 'false'));
                });

                it('throws an error when the list of ciphersuites does not contain any valid one', () => {
                    const invalidTLSConfig = Object.assign({}, config, baseConfig, { tls: { ciphersuites: ['foo', 'bar'] } });
                    const uri = `mysqlx://${invalidTLSConfig.user}:${invalidTLSConfig.password}@${invalidTLSConfig.host}:${invalidTLSConfig.port}?tls-ciphersuites=[${invalidTLSConfig.tls.ciphersuites.join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
                });

                it('throws an error when the connection timeout is not a number above or equal to 0', () => {
                    const invalidTimeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 'foo1' });
                    let uri = `mysqlx://${invalidTimeoutConfig.user}:${invalidTimeoutConfig.password}@${invalidTimeoutConfig.host}:${invalidTimeoutConfig.port}?connect-timeout=${invalidTimeoutConfig.connectTimeout}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);

                    invalidTimeoutConfig.connectTimeout = -1;
                    uri = `mysqlx://${invalidTimeoutConfig.user}:${invalidTimeoutConfig.password}@${invalidTimeoutConfig.host}:${invalidTimeoutConfig.port}?connect-timeout=${invalidTimeoutConfig.connectTimeout}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
                });

                it('throws an error when the connection attributes are badly specified', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: 'foo' });
                    let uri = `mysqlx://${invalidAttributesConfig.user}:${invalidAttributesConfig.password}@${invalidAttributesConfig.host}:${invalidAttributesConfig.port}?connection-attributes=foo`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);

                    invalidAttributesConfig.connectionAttributes = ['foo', 'bar'];
                    uri = `mysqlx://${invalidAttributesConfig.user}:${invalidAttributesConfig.password}@${invalidAttributesConfig.host}:${invalidAttributesConfig.port}?connection-attributes=${invalidAttributesConfig.connectionAttributes.join(',')}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                });

                it('throws an error when the name of any connection attribute starts with "_"', () => {
                    const invalidAttributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { _foo: 'bar' } });
                    const uri = `mysqlx://${invalidAttributesConfig.user}:${invalidAttributesConfig.password}@${invalidAttributesConfig.host}:${invalidAttributesConfig.port}?connection-attributes=[${qs.stringify(invalidAttributesConfig.connectionAttributes)}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                });

                it('throws an error when enabling SRV resolution whilst specifying multiple hosts', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, endpoints: [{ host: 'foo' }, { host: 'bar' }] });
                    const uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@[${invalidSRVConfig.endpoints.map(e => e.host).join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
                });

                it('throws an error when enabling SRV resolution whilst specifying a port', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, port: 33061 });
                    const uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@${invalidSRVConfig.host}:${invalidSRVConfig.port}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
                });

                it('throws an error when enabling SRV resolution whilst specifying a socket', () => {
                    const invalidSRVConfig = Object.assign({}, config, baseConfig, { resolveSrv: true, socket: '/path/to/socket' });
                    let uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@${encodeURIComponent(invalidSRVConfig.socket)}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);

                    uri = `mysqlx+srv://${invalidSRVConfig.user}:${invalidSRVConfig.password}@(${invalidSRVConfig.socket})`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
                });

                it('throws an error when the port is not a number between 0 and 65536', () => {
                    let invalidPortConfig = Object.assign({}, config, baseConfig, { port: -1 });
                    let uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@${invalidPortConfig.host}:${invalidPortConfig.port}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);

                    invalidPortConfig.port = 'foo';
                    uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@${invalidPortConfig.host}:${invalidPortConfig.port}`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);

                    invalidPortConfig = Object.assign({}, config, baseConfig, { endpoints: [{ port: 33060 }, { port: -1 }], port: undefined });
                    uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@[${invalidPortConfig.endpoints.map(e => `${invalidPortConfig.host}:${e.port}`).join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);

                    invalidPortConfig = Object.assign({}, config, baseConfig, { endpoints: [{ port: 33060 }, { port: 'foo' }], port: undefined });
                    uri = `mysqlx://${invalidPortConfig.user}:${invalidPortConfig.password}@[${invalidPortConfig.endpoints.map(e => `${invalidPortConfig.host}:${e.port}`).join(',')}]`;

                    expect(() => mysqlx.getClient(uri))
                        .to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
                });
            });
        });
    });

    context('with an existing idle session', () => {
        const testTimeout = 1; // in seconds
        const waitTimeout = testTimeout * 1000 * 2;
        const originalTimeout = 28800; // in seconds
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'idle.js');

        context('created with TCP and TLS', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: true } };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, waitTimeout))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_IO_READ_ERROR);
                    });
            });

            it('logs the server message sent when the connection is killed', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig })
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const readErrorNotice = proc.logs[proc.logs.length - 1];
                        expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(readErrorNotice.type).to.equal('WARNING');
                        expect(readErrorNotice.scope).to.equal('GLOBAL');
                        expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(readErrorNotice.payload.level).to.equal('ERROR');
                        expect(readErrorNotice.payload.code).to.equal(1810);
                        expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(() => {
                            // wait for a bit more than the value of mysqlx_wait_timeout
                            return new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('created with regular TCP', () => {
            const tcpConfig = { socket: undefined, tls: { enabled: false } };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, testTimeout * 1000 * 2))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_IO_READ_ERROR);
                    });
            });

            it('logs the server message sent when the connection is killed', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig })
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const readErrorNotice = proc.logs[proc.logs.length - 1];
                        expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(readErrorNotice.type).to.equal('WARNING');
                        expect(readErrorNotice.scope).to.equal('GLOBAL');
                        expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(readErrorNotice.payload.level).to.equal('ERROR');
                        expect(readErrorNotice.payload.code).to.equal(1810);
                        expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(() => {
                            // wait for a bit more than the value of mysqlx_wait_timeout
                            return new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('created with a Unix socket', () => {
            const socketConfig = { host: undefined, port: undefined, socket: process.env.MYSQLX_SOCKET, tls: { enabled: false } };

            beforeEach('restrict the server connection timeout', async function () {
                const droppedConnectionConfig = { ...config, ...baseConfig, ...socketConfig };

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                await fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', async function () {
                const droppedConnectionConfig = { ...config, ...baseConfig, ...socketConfig };

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    // afterEach() is not "skipped" and needs to be explicitely
                    // skipped.
                    return this.skip();
                }

                await fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', async () => {
                const droppedConnectionConfig = { ...config, ...baseConfig, ...socketConfig };

                let session;

                try {
                    session = await mysqlx.getSession(droppedConnectionConfig);
                    await new Promise(resolve => setTimeout(resolve, waitTimeout));
                    await session.sql('SELECT 1').execute();
                    expect.fail();
                } catch (err) {
                    expect(err.message).to.equal(errors.MESSAGES.ER_IO_READ_ERROR);
                } finally {
                    await session?.close();
                }
            });

            it('logs the server message sent when the connection is killed', async () => {
                const droppedConnectionConfig = { ...config, ...baseConfig, ...socketConfig };

                const proc = await fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig });
                // it should contain other notices
                expect(proc.logs).to.be.an('array').and.have.length.above(0);
                // but the session kill notice should be the last in the list
                const readErrorNotice = proc.logs[proc.logs.length - 1];
                expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                expect(readErrorNotice.type).to.equal('WARNING');
                expect(readErrorNotice.scope).to.equal('GLOBAL');
                expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                expect(readErrorNotice.payload.level).to.equal('ERROR');
                expect(readErrorNotice.payload.code).to.equal(1810);
                expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = { ...config, ...baseConfig, ...socketConfig };

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', async () => {
                    await Promise.all([pool.getSession(), pool.getSession()]);
                    // wait for a bit more than the value of mysqlx_wait_timeout
                    await new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                    // by this point, the connections should have been released
                    const session = await pool.getSession();
                    const got = await session.sql('SELECT 1').execute();
                    expect(got.fetchOne()).to.deep.equal([1]);
                });
            });
        });
    });

    context('when a connection is killed from a different session', () => {
        const connectionConfig = { socket: undefined };

        context('via the Admin API', () => {
            it('makes the session unusable for subsequent operations', function () {
                const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);
                // The server does to send the notification immediately after
                // the connection is killed. It takes around 1s. So, before
                // attempting to re-use the connection, we should wait a bit
                // for the notification to arrive, otherwise the server will
                // close the socket without an error (2s should be enough).
                const waitForServerNotification = 2000;

                return mysqlx.getSession(killedConnectionConfig)
                    .then(session1 => {
                        return mysqlx.getSession(killedConnectionConfig)
                            .then(session2 => {
                                return sqlExecute(session2.getConnection_(), 'kill_client', [{ id: session1.getConnection_().getServerId() }], sqlExecute.Namespace.X_PLUGIN)
                                    .execute()
                                    .then(() => {
                                        return session2.close();
                                    });
                            })
                            .then(() => {
                                return new Promise(resolve => setTimeout(resolve, waitForServerNotification));
                            })
                            .then(() => {
                                return session1.sql('SELECT 1')
                                    .execute();
                            });
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_SESSION_WAS_KILLED);
                    });
            });

            it('logs the server message sent when the connection is killed', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'admin-kill.js');

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const sessionKillNotice = proc.logs[proc.logs.length - 1];
                        expect(sessionKillNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(sessionKillNotice.type).to.equal('WARNING');
                        expect(sessionKillNotice.scope).to.equal('GLOBAL');
                        expect(sessionKillNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(sessionKillNotice.payload.level).to.equal('ERROR');
                        expect(sessionKillNotice.payload.code).to.equal(3169);
                        expect(sessionKillNotice.payload.msg).to.equal('Session was killed');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                    pool = mysqlx.getClient(killedConnectionConfig, { pooling: { maxSize: 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(sessions => {
                            return sqlExecute(sessions[1].getConnection_(), 'kill_client', [{ id: sessions[0].getConnection_().getServerId() }], sqlExecute.Namespace.X_PLUGIN)
                                .execute();
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('via SQL', () => {
            it('makes the session unusable for subsequent operations', function () {
                const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);
                // The server does to send the notification immediately after
                // the connection is killed. It takes around 1s. So, before
                // attempting to re-use the connection, we should wait a bit
                // for the notification to arrive, otherwise the server will
                // return a "Query execution was interrupted" (2s should be
                // enough).
                const waitForServerNotification = 2000;

                return mysqlx.getSession(killedConnectionConfig)
                    .then(session => {
                        return session.sql('SELECT CONNECTION_ID()')
                            .execute()
                            .then(res => {
                                return mysqlx.getSession(killedConnectionConfig)
                                    .then(session => {
                                        return session.sql('KILL ?')
                                            .bind(res.fetchOne()[0])
                                            .execute()
                                            .then(() => {
                                                return session.close();
                                            });
                                    });
                            })
                            .then(() => {
                                return new Promise(resolve => setTimeout(resolve, waitForServerNotification));
                            })
                            .then(() => {
                                return session.sql('SELECT 1')
                                    .execute();
                            });
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_SESSION_WAS_KILLED);
                    });
            });

            it('logs the server message sent when the connection is killed', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'sql-kill.js');

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const sessionKillNotice = proc.logs[proc.logs.length - 1];
                        expect(sessionKillNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(sessionKillNotice.type).to.equal('WARNING');
                        expect(sessionKillNotice.scope).to.equal('GLOBAL');
                        expect(sessionKillNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(sessionKillNotice.payload.level).to.equal('ERROR');
                        expect(sessionKillNotice.payload.code).to.equal(3169);
                        expect(sessionKillNotice.payload.msg).to.equal('Session was killed');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                    pool = mysqlx.getClient(killedConnectionConfig, { pooling: { maxSize: 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(sessions => {
                            return sessions[0].sql('SELECT CONNECTION_ID()')
                                .execute()
                                .then(res => {
                                    return sessions[1].sql('KILL ?')
                                        .bind(res.fetchOne()[0])
                                        .execute();
                                });
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });
    });

    context('when closing an existing session', () => {
        it('does not fail if the session is being closed multiple times', () => {
            const validConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(validConfig)
                .then(session => {
                    return session.close()
                        .then(() => {
                            return session.close();
                        });
                });
        });

        it('does not fail if the session is being closed multiple times in parallel', () => {
            const validConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(validConfig)
                .then(session => {
                    return Promise.all([session.close(), session.close()]);
                });
        });
    });
});
