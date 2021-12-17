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

'use strict';

/* eslint-env node, mocha */

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let secureContext = require('../../../lib/tls/secure-context');

describe('TLS secure context utilities', () => {
    let tlsCiphers, tlsVersions;

    beforeEach('create fakes', () => {
        tlsCiphers = td.replace('../../../lib/tls/ciphers');
        tlsVersions = td.replace('../../../lib/tls/versions');

        secureContext = require('../../../lib/tls/secure-context');
    });

    afterEach('reset fakes', () => {
        return td.reset();
    });

    context('create()', () => {
        context('when a range of TLS versions is supported', () => {
            beforeEach('create fakes', () => {
                td.replace('tls', { DEFAULT_MAX_VERSION: 'TLSv1.3', DEFAULT_MIN_VERSION: 'TLSv1' });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('defines the range using a list of supported TLS versions', () => {
                const versions = ['TLSv1.2', 'TLSv1.3'];

                td.when(tlsVersions.allowed()).thenReturn(versions);
                td.when(tlsVersions.supported()).thenReturn(versions.slice(1));
                td.when(tlsCiphers.defaults()).thenReturn([]);

                expect(secureContext.create()).to.deep.include({ maxVersion: versions[versions.length - 1], minVersion: versions[versions.length - 1] });
            });

            it('defines the range using the list of provided TLS versions', () => {
                const versions = ['TLSv1.2', 'TLSv1.3'];

                td.when(tlsVersions.allowed()).thenReturn(versions);
                td.when(tlsVersions.supported()).thenReturn(versions);
                td.when(tlsCiphers.defaults()).thenReturn([]);

                return expect(secureContext.create()).to.deep.include({ maxVersion: versions[versions.length - 1], minVersion: versions[0] });
            });
        });

        context('when a range of TLS versions is not supported', () => {
            beforeEach('create fakes', () => {
                td.replace('tls', { DEFAULT_MAX_VERSION: undefined, DEFAULT_MIN_VERSION: undefined });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('defines the latest supported TLS version as the target', () => {
                const versions = ['TLSv1.2'];

                td.when(tlsVersions.allowed()).thenReturn(versions);
                td.when(tlsVersions.supported()).thenReturn(versions);
                td.when(tlsCiphers.defaults()).thenReturn([]);

                expect(secureContext.create()).to.deep.include({ secureProtocol: `${versions[versions.length - 1]}_client_method`.replace('.', '_') });
            });
        });

        it('uses the default list of ciphersuites in OpenSSL format when one is not provided', () => {
            const ciphersuites = ['foo', 'bar'];

            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.defaults()).thenReturn(ciphersuites);

            return expect(secureContext.create()).to.deep.include({ ciphers: 'foo:bar' });
        });

        it('uses the authorized ciphersuites in OpenSSL format from a provided list', () => {
            const ciphersuites = ['foo', 'bar', 'baz', 'qux'];

            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.overlaps(ciphersuites)).thenReturn(['foo', 'bar']);

            return expect(secureContext.create({ ciphersuites })).to.deep.include({ ciphers: 'foo:bar' });
        });

        it('does not reject unauthorized servers when a path to a CA chain PEM file is not provided', () => {
            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.defaults()).thenReturn([]);

            return expect(secureContext.create()).to.deep.include({ rejectUnauthorized: false });
        });

        context('when a path to a certificate authority chain PEM file is provided', () => {
            let fs;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('creates a proper secure context after reading the PEM file', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(fs.readFileSync('foo')).thenReturn('bar');

                return expect(secureContext.create({ ca: 'foo' })).to.deep.include({ ca: 'bar', rejectUnauthorized: true });
            });
        });

        context('when the certificate authority PEM file pointer is provided', () => {
            let fs, isValidPEM;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');
                isValidPEM = td.function();

                td.replace('../../../lib/validator', { isValidPEM });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('creates a proper secure context using the PEM file contents', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(isValidPEM({ value: 'foo' })).thenReturn(true);

                expect(secureContext.create({ ca: 'foo' })).to.deep.include({ ca: 'foo', rejectUnauthorized: true });

                return expect(td.explain(fs.readFileSync).callCount).to.equal(0);
            });
        });

        context('when the multiple certificate authority PEM file pointers are provided', () => {
            let fs, isValidArray, isValidPEM;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');
                isValidArray = td.function();
                isValidPEM = td.function();

                td.replace('../../../lib/validator', { isValidArray, isValidPEM });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('creates a proper secure context using the contents of all PEM files', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(isValidArray({ value: ['foo', 'bar'], validator: isValidPEM })).thenReturn(true);

                expect(secureContext.create({ ca: ['foo', 'bar'] })).to.deep.include({ ca: ['foo', 'bar'], rejectUnauthorized: true });

                return expect(td.explain(fs.readFileSync).callCount).to.equal(0);
            });
        });

        context('when a path to a certificate revocation list PEM file is provided', () => {
            let fs;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('reads the PEM file content', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(fs.readFileSync('foo')).thenReturn('bar');

                return expect(secureContext.create({ crl: 'foo' })).to.deep.include({ crl: 'bar' });
            });
        });

        context('when the certificate revocation list PEM file pointer is provided', () => {
            let fs, isValidPEM;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');
                isValidPEM = td.function();

                td.replace('../../../lib/validator', { isValidPEM });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('creates a proper secure context using the PEM file contents', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(isValidPEM({ value: 'foo' })).thenReturn(true);

                expect(secureContext.create({ crl: 'foo' })).to.deep.include({ crl: 'foo' });

                return expect(td.explain(fs.readFileSync).callCount).to.equal(0);
            });
        });

        context('when the multiple certificate revocation list PEM file pointers are provided', () => {
            let fs, isValidArray, isValidPEM;

            beforeEach('create fakes', () => {
                fs = td.replace('fs');
                isValidArray = td.function();
                isValidPEM = td.function();

                td.replace('../../../lib/validator', { isValidArray, isValidPEM });

                secureContext = require('../../../lib/tls/secure-context');
            });

            it('creates a proper secure context using the contents of all PEM files', () => {
                td.when(tlsVersions.allowed()).thenReturn([]);
                td.when(tlsVersions.supported()).thenReturn([]);
                td.when(tlsCiphers.defaults()).thenReturn([]);
                td.when(isValidArray({ value: ['foo', 'bar'], validator: isValidPEM })).thenReturn(true);

                expect(secureContext.create({ crl: ['foo', 'bar'] })).to.deep.include({ crl: ['foo', 'bar'] });

                return expect(td.explain(fs.readFileSync).callCount).to.equal(0);
            });
        });

        it('uses the builtin "checkServerIdentity" function if certificate identity verification function is explicitly enabled', () => {
            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.defaults()).thenReturn([]);

            return expect(secureContext.create({ checkServerIdentity: true })).to.not.deep.include.keys('checkServerIdentity');
        });

        it('uses a no-op "checkServerIdentity" function if certificate identity verification is not explicitly enabled', () => {
            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.defaults()).thenReturn([]);

            const ctx = secureContext.create();

            expect(ctx).to.deep.include.keys('checkServerIdentity');
            expect(ctx.checkServerIdentity).to.be.a('function');
            return expect(ctx.checkServerIdentity()).to.not.exist;
        });

        it('uses a custom certificate identity verification function if one is provided', () => {
            const checkServerIdentity = () => { };

            td.when(tlsVersions.allowed()).thenReturn([]);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsCiphers.defaults()).thenReturn([]);

            return expect(secureContext.create({ checkServerIdentity })).to.deep.include({ checkServerIdentity });
        });
    });

    context('validate()', () => {
        it('fails when the certificate authority chain is not valid', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH;

            expect(() => secureContext.validate({ tls: { enabled: true, ca: null } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: null } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, ca: 1 } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: 1 } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, ca: true } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: true } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, ca: false } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: false } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, ca: [] } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: [] } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, ca: {} } })).to.throw(error);
            return expect(() => secureContext.validate({ ssl: true, sslOptions: { ca: {} } })).to.throw(error);
        });

        it('fails when the certificate revocation list chain is not valid', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH;

            expect(() => secureContext.validate({ tls: { enabled: true, crl: null } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: null } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, crl: 1 } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: 1 } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, crl: true } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: true } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, crl: false } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: false } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, crl: [] } })).to.throw(error);
            expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: [] } })).to.throw(error);
            expect(() => secureContext.validate({ tls: { enabled: true, crl: {} } })).to.throw(error);
            return expect(() => secureContext.validate({ ssl: true, sslOptions: { crl: {} } })).to.throw(error);
        });

        it('fails when the list of TLS versions is badly specified', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST;

            expect(() => secureContext.validate({ tls: { enabled: true, versions: null } })).to.throw(util.format(error, null));
            expect(() => secureContext.validate({ ssl: true, tls: { versions: null } })).to.throw(util.format(error, null));
            expect(() => secureContext.validate({ tls: { enabled: true, versions: 1 } })).to.throw(util.format(error, 1));
            expect(() => secureContext.validate({ ssl: true, tls: { versions: 1 } })).to.throw(util.format(error, 1));
            expect(() => secureContext.validate({ tls: { enabled: true, versions: true } })).to.throw(util.format(error, true));
            expect(() => secureContext.validate({ ssl: true, tls: { versions: true } })).to.throw(util.format(error, true));
            expect(() => secureContext.validate({ tls: { enabled: true, versions: false } })).to.throw(util.format(error, false));
            expect(() => secureContext.validate({ ssl: true, tls: { versions: false } })).to.throw(util.format(error, false));
            expect(() => secureContext.validate({ tls: { enabled: true, versions: 'foo' } })).to.throw(util.format(error, 'foo'));
            expect(() => secureContext.validate({ ssl: true, tls: { versions: 'foo' } })).to.throw(util.format(error, 'foo'));
            expect(() => secureContext.validate({ tls: { enabled: true, versions: {} } })).to.throw(util.format(error, {}));
            return expect(() => secureContext.validate({ ssl: true, tls: { versions: {} } })).to.throw(util.format(error, {}));
        });

        it('fails when the list of TLS versions only contains invalid values', () => {
            td.when(tlsVersions.allowed()).thenReturn(['foo', 'bar']);
            td.when(tlsVersions.unsupported()).thenReturn([]);

            return expect(() => secureContext.validate({ tls: { versions: ['baz', 'qux'] } })).to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'baz', 'foo, bar'));
        });

        it('fails when all the TLS versions in the list are insecure', () => {
            td.when(tlsVersions.allowed()).thenReturn(['foo', 'bar']);
            td.when(tlsVersions.unsupported()).thenReturn(['baz', 'qux']);

            return expect(() => secureContext.validate({ tls: { versions: ['baz'] } })).to.throw(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, 'baz', 'foo, bar'));
        });

        it('fails when none of the TLS versions in the list are supported', () => {
            td.when(tlsVersions.allowed()).thenReturn(['foo', 'bar']);
            td.when(tlsVersions.supported()).thenReturn([]);
            td.when(tlsVersions.unsupported()).thenReturn([]);

            return expect(() => secureContext.validate({ tls: { versions: ['foo', 'bar'] } })).to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
        });

        it('does not fail if any TLS version in the list if effectively supported by the client', () => {
            td.when(tlsVersions.allowed()).thenReturn(['foo', 'bar']);
            td.when(tlsVersions.supported()).thenReturn(['foo']);
            td.when(tlsVersions.unsupported()).thenReturn(['baz']);
            td.when(tlsCiphers.overlaps(), { ignoreExtraArgs: true }).thenReturn(['qux']);

            return expect(secureContext.validate({ tls: { versions: ['foo', 'bar', 'baz'] } })).to.be.true;
        });

        it('fails when the list of ciphersuites is badly specified', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST;

            // We need to allow and support at least one version.
            td.when(tlsVersions.allowed()).thenReturn(['foo']);
            td.when(tlsVersions.supported()).thenReturn(['foo']);
            td.when(tlsVersions.unsupported()).thenReturn([]);

            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: null } })).to.throw(util.format(error, null));
            expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: null } })).to.throw(util.format(error, null));
            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: 1 } })).to.throw(util.format(error, 1));
            expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: 1 } })).to.throw(util.format(error, 1));
            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: true } })).to.throw(util.format(error, true));
            expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: true } })).to.throw(util.format(error, true));
            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: false } })).to.throw(util.format(error, false));
            expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: false } })).to.throw(util.format(error, false));
            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: 'foo' } })).to.throw(util.format(error, 'foo'));
            expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: 'foo' } })).to.throw(util.format(error, 'foo'));
            expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites: {} } })).to.throw(util.format(error, {}));
            return expect(() => secureContext.validate({ ssl: true, tls: { ciphersuites: {} } })).to.throw(util.format(error, {}));
        });

        it('fails when the list of ciphersuites does not contain any valid one', () => {
            const ciphersuites = ['foo', 'bar'];

            // We need to allow and support at least one version.
            td.when(tlsVersions.allowed()).thenReturn(['baz']);
            td.when(tlsVersions.supported()).thenReturn(['baz']);
            td.when(tlsVersions.unsupported()).thenReturn([]);

            td.when(tlsCiphers.overlaps(ciphersuites)).thenReturn([]);

            return expect(() => secureContext.validate({ tls: { enabled: true, ciphersuites } })).to.throw(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
        });
    });
});
