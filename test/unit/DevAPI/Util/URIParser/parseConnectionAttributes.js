'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseConnectionAttributes = require('../../../../../lib/DevAPI/Util/URIParser/parseConnectionAttributes');

describe('parseConnectionAttributes', () => {
    it('returns an empty object if no attribute element are provided', () => {
        expect(parseConnectionAttributes('?foo=bar&baz=qux')).to.deep.equal({});
    });

    it('returns an empty object if empty attribute is provided', () => {
        expect(parseConnectionAttributes('?connection-attributes=&foo=bar')).to.deep.equal({});
        expect(parseConnectionAttributes('?foo=bar&connection-attributes=')).to.deep.equal({});
    });

    it('returns an empty object if "true" is provided', () => {
        expect(parseConnectionAttributes('?connection-attributes=true')).to.deep.equal({});
    });

    it('returns `null` if "false" is provided', () => {
        return expect(parseConnectionAttributes('?connection-attributes=false')).to.not.exist;
    });

    it('accepts an empty array', () => {
        expect(parseConnectionAttributes('?connection-attributes=[]')).to.deep.equal({});
    });

    it('accepts an empty value', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=]')).to.deep.equal({ foo: '' });
        expect(parseConnectionAttributes('?connection-attributes=[foo=,bar=baz]')).to.deep.equal({ foo: '', bar: 'baz' });
    });

    it('accepts numeric value as string', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=42]')).to.deep.equal({ foo: '42' });
    });

    it('returns an object containing the key-value mappings', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=bar]')).to.deep.equal({ foo: 'bar' });
        expect(parseConnectionAttributes('?connection-attributes=[foo=bar,baz=qux]')).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    it('works with pct-encoded keys and values', () => {
        const key = encodeURIComponent('@#$%^&*        %^()');
        const value = encodeURIComponent('*(&^&#$%0');
        const expected = { [decodeURIComponent(key)]: 'bar', baz: decodeURIComponent(value) };

        expect(parseConnectionAttributes(`?connection-attributes=[${key}=bar,baz=${value}]`)).to.deep.equal(expected);
    });

    it('throws an error for invalid keys', () => {
        expect(() => parseConnectionAttributes('?connection-attributes=[_foo=bar]'))
            .to.throw('Key names in "connection-attributes" cannot start with "_".');
    });

    it('throws an error for invalid values', () => {
        ['foo', 'null', '-'].forEach(value => {
            expect(() => parseConnectionAttributes(`?connection-attributes=${value}`))
                .to.throw('The value of "connection-attributes" must be either a boolean or a list of key-value pairs.');
        });
    });

    it('throws an error for duplicate keys', () => {
        const key = 'foo';

        expect(() => parseConnectionAttributes(`?connection-attributes=[${key}=bar,${key}=baz]`))
            .to.throw('Duplicate key "foo" used in the "connection-attributes" option.');
    });
});
