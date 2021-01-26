/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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

const expect = require('chai').expect;
const parseSecurityOptions = require('../../../../../lib/DevAPI/Util/URIParser/parseSecurityOptions');

describe('parseSecurityOptions', () => {
    it('enables ssl if any of the security related properties are provided', () => {
        // TODO(Rui): add `ssl-mode=VERIFY_CA`, `ssl-mode=VERIFY_IDENTITY` and/or `ssl-mode=VERIFY_CRL`?
        expect(parseSecurityOptions('?ssl-mode=REQUIRED')).to.deep.include({ enabled: true });
        expect(parseSecurityOptions('?ssl-ca=foo')).to.deep.include({ enabled: true });
        expect(parseSecurityOptions('?ssl-crl=bar')).to.deep.include({ enabled: true });
        expect(parseSecurityOptions('?tls-versions=[foo,bar]')).to.deep.include({ enabled: true });
    });

    it('enables ssl by default if no security properties are provided', () => {
        expect(parseSecurityOptions('?foo=bar&baz=qux')).to.deep.equal({ enabled: true });
    });

    it('does not enable ssl if explicitely stated', () => {
        expect(parseSecurityOptions('?ssl-mode=DISABLED')).to.deep.equal({ enabled: false });
    });

    it('parses all the related security properties', () => {
        expect(parseSecurityOptions('?ssl-ca=foo&ssl-crl=bar')).to.deep.equal({ enabled: true, ca: 'foo', crl: 'bar' });
    });

    it('parses a pct-encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=foo%2Fbar')).to.deep.equal({ enabled: true, ca: 'foo/bar' });
    });

    it('parses a custom encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=(/foo/bar')).to.deep.equal({ enabled: true, ca: '/foo/bar' });
    });

    it('parses a pct-encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=foo%2Fbar')).to.deep.equal({ enabled: true, crl: 'foo/bar' });
    });

    it('parses a custom encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=(/foo/bar)')).to.deep.equal({ enabled: true, crl: '/foo/bar' });
    });

    it('parses a list of TLS versions', () => {
        expect(parseSecurityOptions('?tls-versions=[foo,bar,baz]')).to.deep.equal({ enabled: true, versions: ['foo', 'bar', 'baz'] });
    });

    it('parses other values for TLS versions', () => {
        expect(parseSecurityOptions('?tls-versions=foo')).to.deep.equal({ enabled: true, versions: 'foo' });
    });

    it('parses a list of TLS ciphersuites', () => {
        expect(parseSecurityOptions('?tls-ciphersuites=[foo,bar,baz]')).to.deep.equal({ enabled: true, ciphersuites: ['foo', 'bar', 'baz'] });
    });

    it('parses other values for TLS ciphersuites', () => {
        expect(parseSecurityOptions('?tls-ciphersuites=foo')).to.deep.equal({ enabled: true, ciphersuites: 'foo' });
    });

    it('throws an error for duplicate options', () => {
        const error = 'The connection string cannot contain duplicate query parameters.';

        expect(() => parseSecurityOptions('?ssl-mode=REQUIRED&ssl-mode=DISABLED')).to.throw(error);
        expect(() => parseSecurityOptions('?ssl-ca=foo&ssl-ca=bar')).to.throw(error);
        expect(() => parseSecurityOptions('?ssl-crl=foo&ssl-crl=bar')).to.throw(error);
        expect(() => parseSecurityOptions('?tls-versions=[foo,bar]&tls-versions=[baz]')).to.throw(error);
        expect(() => parseSecurityOptions('?tls-ciphersuites=[foo,bar]&tls-ciphersuites=[baz]')).to.throw(error);
    });

    it('ignores case of "ssl-mode" key and value', () => {
        ['?sSl-MoDe=required', '?SSL-MODE=REQUIRED', '?ssl-mode=REQUired'].forEach(valid => {
            expect(parseSecurityOptions(valid)).to.deep.equal({ enabled: true });
        });

        ['?sSl-MoDe=disabled', '?SSL-MODE=DISABLED', '?ssl-mode=DISAbled'].forEach(valid => {
            expect(parseSecurityOptions(valid)).to.deep.equal({ enabled: false });
        });
    });

    it('ignores case of "tls-versions" key', () => {
        expect(parseSecurityOptions('?tLS-veRsionS=[foo,bar]')).to.deep.equal({ enabled: true, versions: ['foo', 'bar'] });
        expect(parseSecurityOptions('?TLS-VERSIONS=[bar,baz]')).to.deep.equal({ enabled: true, versions: ['bar', 'baz'] });
        expect(parseSecurityOptions('?tls-versions=[baz,qux]')).to.deep.equal({ enabled: true, versions: ['baz', 'qux'] });
    });

    it('ignores case of "tls-ciphersuites" key', () => {
        expect(parseSecurityOptions('?tLS-cIpHeRsUiTeS=[foo,bar]')).to.deep.equal({ enabled: true, ciphersuites: ['foo', 'bar'] });
        expect(parseSecurityOptions('?TLS-CIPHERSUITES=[bar,baz]')).to.deep.equal({ enabled: true, ciphersuites: ['bar', 'baz'] });
        expect(parseSecurityOptions('?tls-ciphersuites=[baz,qux]')).to.deep.equal({ enabled: true, ciphersuites: ['baz', 'qux'] });
    });

    it('does not ignore case of security options except `ssl-mode`', () => {
        expect(parseSecurityOptions('?sSl-mOdE=requIRED&ssl-ca=(/Path/TO/ca.pem)')).to.deep.equal({ enabled: true, ca: '/Path/TO/ca.pem' });
        expect(parseSecurityOptions('?sSl-mOdE=requIRED&ssl-crl=(/paTH/tO/CA.PEM)')).to.deep.equal({ enabled: true, crl: '/paTH/tO/CA.PEM' });
        expect(parseSecurityOptions('?sSl-mOdE=requIRED&tls-versions=[FOO,bar,bAz,QuX]')).to.deep.equal({ enabled: true, versions: ['FOO', 'bar', 'bAz', 'QuX'] });
    });
});
