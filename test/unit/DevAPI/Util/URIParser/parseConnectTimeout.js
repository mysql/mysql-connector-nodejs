'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseConnectTimeout = require('../../../../../lib/DevAPI/Util/URIParser/parseConnectTimeout');

describe('parseConnectTimeout', () => {
    it('returns `10000` if no connection timeout value is provided', () => {
        expect(parseConnectTimeout('?foo=bar&baz=qux')).to.deep.equal('10000');
    });

    it('returns an empty string if the parameter does not contain a value', () => {
        [' ', ''].forEach(empty => {
            expect(parseConnectTimeout(`?connect-timeout=${empty}`)).to.deep.equal('');
        });
    });

    it('returns the provided raw value', () => {
        ['foo', '""', 20].forEach(raw => {
            expect(parseConnectTimeout(`?connect-timeout=${raw}`)).to.deep.equal(raw.toString());
        });
    });

    it('throws an error for duplicate options', () => {
        expect(() => parseConnectTimeout('?connect-timeout=10&connect-timeout=20')).to.throw('Duplicate options');
    });
});
