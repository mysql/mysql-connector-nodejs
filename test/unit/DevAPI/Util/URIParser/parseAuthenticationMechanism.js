'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseAuthenticationMechanism = require('../../../../../lib/DevAPI/Util/URIParser/parseAuthenticationMechanism');

describe('parseAuthenticationMechanism', () => {
    it('returns an empty string if no authentication mechanism is provided', () => {
        expect(parseAuthenticationMechanism('?foo=bar&baz=qux')).to.deep.equal('');
    });

    it('throws an error for duplicate options', () => {
        expect(() => parseAuthenticationMechanism('?auth=FOO&auth=BAR')).to.throw('Duplicate options');
    });

    it('ignores case of `auth` value', () => {
        ['?aUtH=foobar', '?AUTH=fOoBaR', '?auth=FoObAr', '?AuTh=FOOBAR', '?AUTH=Foobar'].forEach(valid => {
            expect(parseAuthenticationMechanism(valid)).to.deep.equal('FOOBAR');
        });
    });
});
