'use strict';

/* eslint-env node, mocha */

const parseQueryParameters = require('lib/DevAPI/Util/URIParser/parseQueryParameters');
const expect = require('chai').expect;

describe('parseQueryParameters', () => {
    it('should parse a valid query string', () => {
        expect(parseQueryParameters('foo=bar&baz=qux')).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    // TODO(Rui): not sure if this looks good.
    it('should parse empty parameter values', () => {
        ['foo=&bar=', 'foo&bar'].forEach(querystring => {
            expect(parseQueryParameters(querystring)).to.deep.equal({ foo: '', bar: '' });
        });
    });

    it('should parse a query string with pct-encoded values', () => {
        expect(parseQueryParameters('foobar=foo%2Fbar&bazqux=baz%2Fqux')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('should parse a query string with custom encoded text', () => {
        expect(parseQueryParameters('foobar=(foo/bar)&bazqux=(baz/qux)')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('should parse an empty querystring', () => {
        expect(parseQueryParameters('')).to.deep.equal({});
    });
});
