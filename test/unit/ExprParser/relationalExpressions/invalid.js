'use strict';

/* eslint-env node, mocha */

const Parser = require('../../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('invalid Relational Expressions', () => {
        const options = { mode: Parser.Mode.TABLE };

        it('does not parse invalid document-mode expressions', () => {
            expect(() => Parser.parse("doc->'foo**.bar'", options)).to.throw();
            expect(() => Parser.parse("doc->'foo[*].bar", options)).to.throw();
            expect(() => Parser.parse("doc->'_**._'", options)).to.throw();
            expect(() => Parser.parse("doc->'_**[*]._'", options)).to.throw();
            expect(() => Parser.parse("doc->_**[*]._**._'", options)).to.throw();
            expect(() => Parser.parse("[<doc->'$.foo', bar>]", options)).to.throw();
            expect(() => Parser.parse('[<"foo", 1>]', options)).to.throw();
            expect(() => Parser.parse("{<doc->'$.foobar'>}", options)).to.throw();
        });

        it('does not parse document-only expressions', () => {
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

        it('fails when "not" identifiers are used alongisde operators with the same optional prefix', () => {
            expect(() => Parser.parse('not in (1, 2, 3)', options)).to.throw();
            expect(() => Parser.parse('not not in (1, 2, 3)', options));
            expect(() => Parser.parse("not like '%foo'", options)).to.throw();
            return expect(() => Parser.parse("not not like '%foo'", options)).to.throw();
        });
    });
});
