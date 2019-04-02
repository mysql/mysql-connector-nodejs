'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseSecurityOptions = require('../../../../../lib/DevAPI/Util/URIParser/parseSecurityOptions');

describe('parseSecurityOptions', () => {
    it('enables ssl if any of the security related properties are provided', () => {
        // TODO(Rui): add `ssl-mode=VERIFY_CA`, `ssl-mode=VERIFY_IDENTITY` and/or `ssl-mode=VERIFY_CRL`?
        ['ssl-mode=REQUIRED', 'ssl-ca=foo', 'ssl-crl=bar'].forEach(pair => {
            expect(parseSecurityOptions(`?${pair}`)).to.deep.include({ enable: true });
        });
    });

    it('enables ssl by default if no security properties are provided', () => {
        expect(parseSecurityOptions('?foo=bar&baz=qux')).to.deep.equal({ enable: true });
    });

    it('does not enable ssl if explicitely stated', () => {
        expect(parseSecurityOptions('?ssl-mode=DISABLED')).to.deep.equal({ enable: false });
    });

    it('parses all the related security properties', () => {
        expect(parseSecurityOptions('?ssl-ca=foo&ssl-crl=bar')).to.deep.equal({ enable: true, ca: 'foo', crl: 'bar' });
    });

    it('parses a pct-encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=foo%2Fbar')).to.deep.equal({ enable: true, ca: 'foo/bar' });
    });

    it('parses a custom encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=(/foo/bar')).to.deep.equal({ enable: true, ca: '/foo/bar' });
    });

    it('parses a pct-encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=foo%2Fbar')).to.deep.equal({ enable: true, crl: 'foo/bar' });
    });

    it('parses a custom encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=(/foo/bar)')).to.deep.equal({ enable: true, crl: '/foo/bar' });
    });

    it('throws an error for inconsistent option combination', () => {
        ['ssl-ca=foo', 'ssl-crl=bar', 'ssl-ca=foo&ssl-crl=bar'].forEach(inconsistent => {
            expect(() => parseSecurityOptions(`?ssl-mode=DISABLED&${inconsistent}`)).to.throw('Inconsistent security options');
        });
    });

    it('throws an error for duplicate options', () => {
        ['?ssl-mode=REQUIRED&ssl-mode=DISABLED', '?ssl-ca=foo&ssl-ca=bar', '?ssl-crl=foo&ssl-crl=bar'].forEach(duplicate => {
            expect(() => parseSecurityOptions(duplicate)).to.throw('Duplicate options');
        });
    });

    it('ignores case of `ssl-mode` value', () => {
        ['?sSl-MoDe=required', '?SSL-MODE=REQUIRED', '?ssl-mode=REQUired'].forEach(valid => {
            expect(parseSecurityOptions(valid)).to.deep.equal({ enable: true });
        });

        ['?sSl-MoDe=disabled', '?SSL-MODE=DISABLED', '?ssl-mode=DISAbled'].forEach(valid => {
            expect(parseSecurityOptions(valid)).to.deep.equal({ enable: false });
        });
    });

    it('does not ignore case of security options except `ssl-mode`', () => {
        expect(parseSecurityOptions('?sSl-mOdE=requIRED&ssl-ca=(/Path/TO/ca.pem)')).to.deep.equal({ enable: true, ca: '/Path/TO/ca.pem' });

        expect(parseSecurityOptions('?sSl-mOdE=requIRED&ssl-crl=(/paTH/tO/CA.PEM)')).to.deep.equal({ enable: true, crl: '/paTH/tO/CA.PEM' });
    });
});
