'use strict';

/* eslint-env node, mocha */

const parseSchema = require('lib/DevAPI/Util/URIParser/parseSchema');
const expect = require('chai').expect;

describe('parseSchema', () => {
    it('should parse a valid schema name', () => {
        expect(parseSchema('/foo')).to.equal('foo');
    });

    it('should parse an empty schema name', () => {
        ['', '/'].forEach(schema => {
            expect(parseSchema(schema)).to.equal(undefined);
        });
    });

    it('should throw na error if the schema name is not valid', () => {
        ['/foo/bar', '/foo#bar', '/foo[bar', '/foo]bar'].forEach(schema => {
            expect(() => parseSchema(schema)).to.throw('Invalid schema name');
        });
    });
});
