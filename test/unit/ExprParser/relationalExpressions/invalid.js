'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Parser = require('lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('invalid Relational Expressions', () => {
        const options = { mode: Parser.Mode.TABLE };

        it('should not parse invalid document-mode expressions', () => {
            expect(() => Parser.parse("doc->'foo**.bar'", options)).to.throw();
            expect(() => Parser.parse("doc->'foo[*].bar", options)).to.throw();
            expect(() => Parser.parse("doc->'_**._'", options)).to.throw();
            expect(() => Parser.parse("doc->'_**[*]._'", options)).to.throw();
            expect(() => Parser.parse("doc->_**[*]._**._'", options)).to.throw();
            expect(() => Parser.parse("[<doc->'$.foo', bar>]", options)).to.throw();
            expect(() => Parser.parse('[<"foo", 1>]', options)).to.throw();
            expect(() => Parser.parse("{<doc->'$.foobar'>}", options)).to.throw();
        });

        it('should not parse document-only expressions', () => {
            expect(() => Parser.parse('foo**.bar', options)).to.throw();
            expect(() => Parser.parse('foo[*].bar', options)).to.throw();
            expect(() => Parser.parse('_**._', options)).to.throw();
            expect(() => Parser.parse('_**[*]._', options)).to.throw();
            expect(() => Parser.parse('_**[*]._**._', options)).to.throw();
            expect(() => Parser.parse('$.foo.bar[*]', options)).to.throw();
            expect(() => Parser.parse('$ = {"a":1}', options)).to.throw();
            expect(() => Parser.parse('$." ".bar', options)).to.throw();
            expect(() => Parser.parse('$.a[0].b[0]', options)).to.throw();
            expect(() => Parser.parse('$.a[0][0]', options)).to.throw();
            expect(() => Parser.parse('$.a[*][*]', options)).to.throw();
            expect(() => Parser.parse('$.a[*].z', options)).to.throw();
            expect(() => Parser.parse('$."foo bar"."baz**" = $', options)).to.throw();
            expect(() => Parser.parse('$.foo**.bar', options)).to.throw();
            expect(() => Parser.parse('$."foo bar"**.baz', options)).to.throw();
            expect(() => Parser.parse('$."foo"**."bar"', options)).to.throw();
            expect(() => Parser.parse('$."foo."**."bar"', options)).to.throw();
            expect(() => Parser.parse('$."foo."**.".bar"', options)).to.throw();
            expect(() => Parser.parse('$.""', options)).to.throw();
            expect(() => Parser.parse('$**.bar', options)).to.throw();
            expect(() => Parser.parse('$**[0]', options)).to.throw();
            expect(() => Parser.parse('$**.foo', options)).to.throw();
            expect(() => Parser.parse('$.a**[0]', options)).to.throw();
            expect(() => Parser.parse('$.a**[*]', options)).to.throw();
            expect(() => Parser.parse('$.a**.foo', options)).to.throw();
        });
    });
});
