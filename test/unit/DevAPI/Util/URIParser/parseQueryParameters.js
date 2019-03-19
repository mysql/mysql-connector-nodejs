'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseQueryParameters = require('../../../../../lib/DevAPI/Util/URIParser/parseQueryParameters');

describe('parseQueryParameters', () => {
    it('parses a valid query string', () => {
        expect(parseQueryParameters('foo=bar&baz=qux')).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    // TODO(Rui): not sure if this looks good.
    it('parses empty parameter values', () => {
        ['foo=&bar=', 'foo&bar'].forEach(querystring => {
            expect(parseQueryParameters(querystring)).to.deep.equal({ foo: '', bar: '' });
        });
    });

    it('parses a query string with pct-encoded values', () => {
        expect(parseQueryParameters('foobar=foo%2Fbar&bazqux=baz%2Fqux')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('parses a query string with custom encoded text', () => {
        expect(parseQueryParameters('foobar=(foo/bar)&bazqux=(baz/qux)')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('parses an empty querystring', () => {
        expect(parseQueryParameters('')).to.deep.equal({});
    });

    it('optionally throws an error for duplicate parameters', () => {
        expect(() => parseQueryParameters('foo=bar&foo=baz', { allowDuplicates: false })).to.throw('The connection string cannot contain duplicate query parameters.');
    });

    it('supports case-insensitive option keys', () => {
        expect(parseQueryParameters('fOo=bar&BAZ=QuX')).to.deep.equal({ foo: 'bar', baz: 'QuX' });
    });

    it('supports specific case-insensitive option values', () => {
        expect(parseQueryParameters('fOo=BaR&BAZ=QuX', { ignoreCase: ['foo'] })).to.deep.equal({ foo: 'bar', baz: 'QuX' });
    });
});
