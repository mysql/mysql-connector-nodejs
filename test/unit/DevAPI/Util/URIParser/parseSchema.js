'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseSchema = require('../../../../../lib/DevAPI/Util/URIParser/parseSchema');

describe('parseSchema', () => {
    it('parses a valid schema name', () => {
        expect(parseSchema('/foo')).to.equal('foo');
    });

    it('parses an empty schema name', () => {
        ['', '/'].forEach(schema => {
            expect(parseSchema(schema)).to.equal(undefined);
        });
    });

    it('parses a pct-encoded schema name', () => {
        expect(parseSchema(`/${encodeURIComponent('%&^*^_')}`)).to.equal('%&^*^_');
    });

    it('throws na error if the schema name is not valid', () => {
        ['/foo/bar', '/foo#bar', '/foo[bar', '/foo]bar'].forEach(schema => {
            expect(() => parseSchema(schema)).to.throw('Invalid schema name');
        });
    });
});
