/*
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
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

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const expect = require('chai').expect;
const fs = require('fs');
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');
const warnings = require('../../../../lib/constants/warnings');

describe('connecting to the server using TLS certificates', () => {
    const baseConfig = { schema: undefined, socket: undefined };
    // directory containing the certificates
    const certificates = path.join(__dirname, '..', '..', '..', 'fixtures', 'tls', 'client');

    context('with a server certificate signed by the root certificate authority', () => {
        // container name as defined in docker-compose.yml
        const tlsCertificateConfig = { host: 'mysql-root-signed-cert' };

        context('when providing a path for a file containing the certificate authority chain', () => {
            context('using a connection configuration object', () => {
                it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                    const ca = path.join(certificates, 'root', 'ca.pem');
                    const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                    const session = await mysqlx.getSession(secureConfig);
                    expect(session.inspect()).to.have.property('tls', true);

                    await session?.close();
                });

                it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                    // Since the server cerfificate is signed by the Root CA,
                    // the Leaf CA is outside the certificate authority chain.
                    const ca = path.join(certificates, 'leaf', 'ca.pem');
                    const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                    let session;

                    try {
                        await mysqlx.getSession(secureConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                    } finally {
                        await session?.close();
                    }
                });

                it('fails if the server identity custom verification is not successful', async () => {
                    const ca = path.join(certificates, 'root', 'ca.pem');
                    const error = new Error('foobar');

                    // checkServerIdentity should not "throw" the error, but
                    // "return" it instead
                    const checkServerIdentity = () => { return error; };
                    const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity } };

                    let session;

                    try {
                        await mysqlx.getSession(secureConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err).to.deep.equal(error);
                    } finally {
                        await session?.close();
                    }
                });

                it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                    const ca = path.join(certificates, 'root', 'ca.pem');
                    const crl = path.join(certificates, 'root', 'empty-crl.pem');
                    const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                    const session = await mysqlx.getSession(secureConfig);
                    expect(session.inspect()).to.have.property('tls', true);

                    await session?.close();
                });

                it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                    const ca = path.join(certificates, 'root', 'ca.pem');
                    const crl = path.join(certificates, 'root', 'crl.pem');
                    const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                    let session;

                    try {
                        await mysqlx.getSession(secureConfig);
                        expect.fail();
                    } catch (err) {
                        expect(err.code).to.equal('CERT_REVOKED');
                    } finally {
                        await session?.close();
                    }
                });

                context('when deprecated TLS connection properties are used', () => {
                    it('writes a deprecation warning to the log when debug mode is enabled', async () => {
                        // TLS is only available over TCP connections
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const scriptConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, sslOptions: { ca } };
                        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

                        const proc = await fixtures.collectLogs('connection:options.sslOptions', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING });

                        expect(proc.logs).to.have.lengthOf(1);
                        expect(proc.logs[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_SSL_ADDITIONAL_OPTIONS);
                    });

                    it('writes a deprecation warning to stdout when debug mode is not enabled', done => {
                        const tlsConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, ssl: true };
                        const warningMessages = [];

                        process.on('warning', warning => {
                            if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                                warningMessages.push(warning.message);
                            }

                            if (warning.name && warning.name === 'NoWarning') {
                                process.removeAllListeners('warning');

                                expect(warningMessages).to.have.lengthOf(1);
                                expect(warningMessages[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_SSL_OPTION);

                                return done();
                            }
                        });

                        mysqlx.getSession(tlsConfig)
                            .then(session => {
                                return session.close();
                            })
                            .then(() => {
                                return process.emitWarning('No more warnings.', 'NoWarning');
                            });
                    });
                });
            });

            context('using a connection string', () => {
                context('that enables certificate authority verification', () => {
                    const tlsMode = 'VERIFY_CA';

                    it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect()).to.have.property('tls', true);

                        await session?.close();
                    });

                    it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                        // Since the server cerfificate is signed by the Root
                        // CA, the Leaf CA is outside the certificate
                        // authority chain.
                        const ca = path.join(certificates, 'leaf', 'ca.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                        } finally {
                            await session?.close();
                        }
                    });

                    it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const crl = path.join(certificates, 'root', 'empty-crl.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}&ssl-crl=${secureConfig.tls.crl}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect()).to.have.property('tls', true);

                        await session?.close();
                    });

                    it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const crl = path.join(certificates, 'root', 'crl.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}&ssl-crl=${secureConfig.tls.crl}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.code).to.equal('CERT_REVOKED');
                        } finally {
                            await session?.close();
                        }
                    });
                });

                context('that enables identity verification', () => {
                    const tlsMode = 'VERIFY_IDENTITY';

                    it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect()).to.have.property('tls', true);

                        await session?.close();
                    });

                    it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                        // Since the server cerfificate is signed by the Root
                        // CA, the Leaf CA is outside the certificate
                        // authority chain.
                        const ca = path.join(certificates, 'leaf', 'ca.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                        } finally {
                            await session?.close();
                        }
                    });

                    it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const crl = path.join(certificates, 'root', 'empty-crl.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}&ssl-crl=${secureConfig.tls.crl}`;

                        const session = await mysqlx.getSession(uri);
                        expect(session.inspect()).to.have.property('tls', true);

                        await session?.close();
                    });

                    it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                        const ca = path.join(certificates, 'root', 'ca.pem');
                        const crl = path.join(certificates, 'root', 'crl.pem');
                        const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };
                        const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=${tlsMode}&ssl-ca=${secureConfig.tls.ca}&ssl-crl=${secureConfig.tls.crl}`;

                        let session;

                        try {
                            session = await mysqlx.getSession(uri);
                            expect.fail();
                        } catch (err) {
                            expect(err.code).to.equal('CERT_REVOKED');
                        } finally {
                            await session?.close();
                        }
                    });
                });
            });
        });

        context('when providing a single pointer to binary PEM content', () => {
            it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'));
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                // Since the server cerfificate is signed by the Root CA, the
                // Leaf CA is outside the certificate authority chain.
                const ca = fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'));
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                } finally {
                    await session?.close();
                }
            });

            it('fails if the server identity custom verification is not successful', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'));
                const error = new Error('foobar');

                // checkServerIdentity should not "throw" the error, but
                // "return" it instead
                const checkServerIdentity = () => { return error; };
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err).to.deep.equal(error);
                } finally {
                    await session?.close();
                }
            });

            it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'));
                const crl = fs.readFileSync(path.join(certificates, 'root', 'empty-crl.pem'));
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'));
                const crl = fs.readFileSync(path.join(certificates, 'root', 'crl.pem'));
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('CERT_REVOKED');
                } finally {
                    await session?.close();
                }
            });
        });

        context('when providing a single pointer to textual PEM content', () => {
            it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' });
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                // Since the server cerfificate is signed by the Root CA, the
                // Leaf CA is outside the certificate authority chain.
                const ca = fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'), { encoding: 'ascii' });
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                } finally {
                    await session?.close();
                }
            });

            it('fails if the server identity custom verification is not successful', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' });
                const error = new Error('foobar');

                // checkServerIdentity should not "throw" the error, but
                // "return" it instead
                const checkServerIdentity = () => { return error; };
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err).to.deep.equal(error);
                } finally {
                    await session?.close();
                }
            });

            it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' });
                const crl = fs.readFileSync(path.join(certificates, 'root', 'empty-crl.pem'), { encoding: 'ascii' });
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' });
                const crl = fs.readFileSync(path.join(certificates, 'root', 'crl.pem'), { encoding: 'ascii' });
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('CERT_REVOKED');
                } finally {
                    await session?.close();
                }
            });
        });
    });

    context('with a server certificate signed by an intermediate certificate authority', () => {
        // container name as defined in docker-compose.yml
        const tlsCertificateConfig = { host: 'mysql-leaf-signed-cert' };

        context('when providing an array of pointers to binary PEM content', () => {
            it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'))
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                // The certificate has been signed by the leaf CA and not by
                // the root CA.
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'));
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                } finally {
                    await session?.close();
                }
            });

            it('fails if the server identity custom verification is not successful', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'))
                ];
                const error = new Error('foobar');

                // checkServerIdentity should not "throw" the error, but
                // "return" it instead
                const checkServerIdentity = () => { return error; };
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err).to.deep.equal(error);
                } finally {
                    await session?.close();
                }
            });

            it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'))
                ];

                const crl = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'empty-crl.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'crl.pem'))
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'))
                ];

                const crl = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'crl.pem')),
                    fs.readFileSync(path.join(certificates, 'root', 'crl.pem'))
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('CERT_REVOKED');
                } finally {
                    await session?.close();
                }
            });
        });

        context('when providing an array of pointers to textual PEM content', () => {
            it('succeeds if the server certificate was signed by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' })
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was not signed by a certificate authority in the given chain', async () => {
                // The certificate has been signed by the leaf CA and not by
                // the root CA.
                const ca = fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' });
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
                } finally {
                    await session?.close();
                }
            });

            it('fails if the server identity custom verification is not successful', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' })
                ];
                const error = new Error('foobar');

                // checkServerIdentity should not "throw" the error, but
                // "return" it instead
                const checkServerIdentity = () => { return error; };
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err).to.deep.equal(error);
                } finally {
                    await session?.close();
                }
            });

            it('succeeds if the server certificate was not revoked by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' })
                ];

                const crl = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'empty-crl.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'crl.pem'), { encoding: 'ascii' })
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if the server certificate was revoked by a certificate authority in the given chain', async () => {
                const ca = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'ca.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'ca.pem'), { encoding: 'ascii' })
                ];

                const crl = [
                    fs.readFileSync(path.join(certificates, 'leaf', 'crl.pem'), { encoding: 'ascii' }),
                    fs.readFileSync(path.join(certificates, 'root', 'crl.pem'), { encoding: 'ascii' })
                ];

                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, crl } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('CERT_REVOKED');
                } finally {
                    await session?.close();
                }
            });
        });
    });

    context('with a server certificate with the wrong identity', () => {
        // container name as defined in docker-compose.yml
        const tlsCertificateConfig = { host: 'mysql-wrong-cert-identity' };

        context('using a connection configuration object', () => {
            it('succeeds if certificate identity verification is not explicitly enabled', async () => {
                const ca = path.join(certificates, 'root', 'ca.pem');
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };

                const session = await mysqlx.getSession(secureConfig);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if certificate identity verification is explicitly enabled', async () => {
                const ca = path.join(certificates, 'root', 'ca.pem');
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca, checkServerIdentity: true } };

                let session;

                try {
                    session = await mysqlx.getSession(secureConfig);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('ERR_TLS_CERT_ALTNAME_INVALID');
                } finally {
                    await session?.close();
                }
            });
        });

        context('using a connection string', () => {
            it('succeeds if certificate identity verification is not explicitly enabled', async () => {
                const ca = path.join(certificates, 'root', 'ca.pem');
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=VERIFY_CA&ssl-ca=${secureConfig.tls.ca}`;

                const session = await mysqlx.getSession(uri);
                expect(session.inspect()).to.have.property('tls', true);

                await session?.close();
            });

            it('fails if certificate identity verification is explicitly enabled', async () => {
                const ca = path.join(certificates, 'root', 'ca.pem');
                const secureConfig = { ...config, ...baseConfig, ...tlsCertificateConfig, tls: { enabled: true, ca } };
                const uri = `mysqlx://${secureConfig.user}:${secureConfig.password}@${secureConfig.host}:${secureConfig.port}?ssl-mode=VERIFY_IDENTITY&ssl-ca=${secureConfig.tls.ca}`;

                let session;

                try {
                    session = await mysqlx.getSession(uri);
                    expect.fail();
                } catch (err) {
                    expect(err.code).to.equal('ERR_TLS_CERT_ALTNAME_INVALID');
                } finally {
                    await session?.close();
                }
            });
        });
    });
});
