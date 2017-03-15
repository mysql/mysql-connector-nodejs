'use strict';

/* eslint-env node, mocha */

const parseSecurityOptions = require('lib/DevAPI/Util/URIParser/parseSecurityOptions');
const expect = require('chai').expect;

describe('parseSecurityOptions', () => {
    it('should enable ssl if any of the security related properties are provided', () => {
        ['ssl-enable', 'ssl-ca=foo', 'ssl-crl=bar'].forEach(pair => {
            expect(parseSecurityOptions(`?${pair}`)).to.deep.include({ enable: true });
        });
    });

    it('should not enable ssl if no security properties are provided', () => {
        expect(parseSecurityOptions('?foo=bar&baz=qux')).to.deep.equal({ enable: false });
    });

    it('should parse all the related security properties', () => {
        expect(parseSecurityOptions('?ssl-ca=foo&ssl-crl=bar')).to.deep.equal({ enable: true, ca: 'foo', crl: 'bar' });
    });

    it('should parse a pct-encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=foo%2Fbar')).to.deep.equal({ enable: true, ca: 'foo/bar' });
    });

    it('should parse a custom encoded CA file path', () => {
        expect(parseSecurityOptions('?ssl-ca=(/foo/bar')).to.deep.equal({ enable: true, ca: '/foo/bar' });
    });

    it('should parse a pct-encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=foo%2Fbar')).to.deep.equal({ enable: true, crl: 'foo/bar' });
    });

    it('should parse a custom encoded CRL file path', () => {
        expect(parseSecurityOptions('?ssl-crl=(/foo/bar)')).to.deep.equal({ enable: true, crl: '/foo/bar' });
    });
});
