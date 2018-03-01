'use strict';

/* eslint-env node, mocha */

const escapeQuotes = require('lib/DevAPI/Util/escapeQuotes');
const expect = require('chai').expect;

describe('escapeQuotes', () => {
    it('should escape double quotes from a string', () => {
        return expect(escapeQuotes('foo"bar')).to.equal('foo\\"bar');
    });

    it('should escape mixing escaping characters and double quotes from string', () => {
        return expect(escapeQuotes('foo\\"bar')).to.equal('foo\\\\"bar');
    });

    it('should ignore empty strings', () => {
        return expect(escapeQuotes('')).to.be.empty;
    });

    it('should escape backticks', () => {
        expect(escapeQuotes('foo')).to.equal('foo');
        expect(escapeQuotes('fo`o')).to.equal('fo``o');
        expect(escapeQuotes('fo``o-ba``r')).to.equal('fo````o-ba````r');
    });
});
