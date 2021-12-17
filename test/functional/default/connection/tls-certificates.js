/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');
const warnings = require('../../../../lib/constants/warnings');

describe('connecting to the server using TLS certificates', () => {
    const baseConfig = { socket: undefined };

    context('using a connection configuration object', () => {
        context('when TLS is disabled', () => {
            it('does not verify if the server certificate has been signed by a certificate in the authority chain', () => {
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false, ca: '/any/path/to/ca.pem' } });

                return mysqlx.getSession(tlsConfig)
                    .then(session => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(session.inspect().tls).to.be.false;
                        return session.close();
                    });
            });

            it('does not verify if the server certificate has been revoked by a certificate in the authority chain', () => {
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false, ca: '/any/path/to/ca.pem', crl: '/any/path/to/crl.pem' } });

                return mysqlx.getSession(tlsConfig)
                    .then(session => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(session.inspect().tls).to.be.false;
                        return session.close();
                    });
            });
        });
    });

    context('using a connection string', () => {
        context('when the TLS mode option is not specified', () => {
            context('and debug mode is not enabled', () => {
                it('writes a deprecation warning to stdout when the path to a certificate authority file is provided', done => {
                    const tlsConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/any/path/to/ca.pem' } });
                    const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/?ssl-ca=${encodeURIComponent(tlsConfig.tls.ca)}`;

                    process.on('warning', warning => {
                        if ((!warning.name || warning.name !== warnings.TYPES.GENERIC) || (!warning.code || !warning.code.startsWith(warnings.CODES.GENERIC))) {
                            return;
                        }

                        process.removeAllListeners('warning');
                        expect(warning.message).to.equal(warnings.MESSAGES.WARN_STRICT_CERTIFICATE_VALIDATION);

                        return done();
                    });

                    mysqlx.getSession(uri)
                        .then(session => {
                            // eslint-disable-next-line no-unused-expressions
                            expect(session.inspect().tls).to.be.true;
                            return session.close();
                        });
                });
            });

            context('and debug mode is enabled', () => {
                it('writes a deprecation warning to the debug log when the path to a certificate authority file is provided', () => {
                    // TLS is only available over TCP connections
                    // The socket should be null since JSON.stringify() removes undefined properties
                    const scriptConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/any/path/to/ca.pem' }, socket: null });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'implicit-ssl-mode.js');

                    return fixtures.collectLogs('parser:uri:tls.ssl-ca', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(1);
                            expect(proc.logs[0]).to.equal(warnings.MESSAGES.WARN_STRICT_CERTIFICATE_VALIDATION);
                        });
                });
            });
        });

        context('when TLS is disabled', () => {
            it('does not verify if the server certificate has been signed by a certificate in the authority chain', () => {
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false, ca: '/any/path/to/ca.pem' } });
                const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/?ssl-mode=DISABLED&ssl-ca=${encodeURIComponent(tlsConfig.tls.ca)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(session.inspect().tls).to.be.false;
                        return session.close();
                    });
            });

            it('does not verify if the server certificate has been revoked by a certificate in the authority chain', () => {
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { enabled: false, ca: '/any/path/to/ca.pem', crl: '/any/path/to/crl.pem' } });
                const uri = `mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/?ssl-mode=DISABLED&ssl-ca=${encodeURIComponent(tlsConfig.tls.ca)}&ssl-crl=${encodeURIComponent(tlsConfig.tls.crl)}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(session.inspect().tls).to.be.false;
                        return session.close();
                    });
            });
        });
    });
});
