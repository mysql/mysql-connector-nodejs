'use strict';

/* eslint-env node, mocha */

const Parser = require('../../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('invalid Document Expressions', () => {
        it('does not parse invalid document-mode expressions', () => {
            expect(() => Parser.parse('$.')).to.throw();
            expect(() => Parser.parse('.doc')).to.throw();
            expect(() => Parser.parse('**')).to.throw();
            expect(() => Parser.parse('**foo')).to.throw();
            // TODO(Rui): this fails because the documentPath grammar is not restrictive enough
            // since "**" should not be allowed by documentPathLastItem
            // expect(() => Parser.parse('_**')).to.throw();
            expect(() => Parser.parse('_**[*]_**._')).to.throw();
            expect(() => Parser.parse('_**[*]._.**._')).to.throw();
            expect(() => Parser.parse('_**[*]_.**._')).to.throw();
            // TODO(Rui): this fails because the documentPath grammar is not restrictive enough
            // since "**" should not be allowed by documentPathLastItem
            // expect(() => Parser.parse('$.foo**')).to.throw();
            expect(() => Parser.parse('$.foo.**.bar')).to.throw();
            expect(() => Parser.parse('$.foo[**]')).to.throw();
            // TODO(Rui): this fails because the documentPath grammar is not restrictive enough
            // since "**" should not be allowed by documentPathLastItem
            // expect(() => Parser.parse('$**')).to.throw();
            expect(() => Parser.parse('$.**')).to.throw();
            // expect(() => Parser.parse('$.**bar')).to.throw();
            // expect(() => Parser.parse('$.**".bar"')).to.throw();
            expect(() => Parser.parse('$.**.bar')).to.throw();
            expect(() => Parser.parse('$.foo..bar')).to.throw();
            expect(() => Parser.parse('foo[*]."bar"')).to.throw();
            expect(() => Parser.parse('"foo".bar')).to.throw();
            expect(() => Parser.parse('$**.bar()')).to.throw();
            expect(() => Parser.parse('[<foo, bar>]')).to.throw();
            expect(() => Parser.parse('[<"foo", 1>]')).to.throw();
            expect(() => Parser.parse('{<foobar>}')).to.throw();
        });

        it('does not parse relational-only expressions', () => {
            expect(() => Parser.parse("doc->'$.foo'")).to.throw();
            expect(() => Parser.parse("foo.bar->'$.foo'")).to.throw();
        });

        it('fails when "not" identifiers are used alongisde operators with the same optional prefix', () => {
            expect(() => Parser.parse('not in [1, 2, 3]')).to.throw();
            expect(() => Parser.parse('not not in [1, 2, 3]'));
            expect(() => Parser.parse("not like '%foo'")).to.throw();
            return expect(() => Parser.parse("not not like '%foo'")).to.throw();
        });
    });
});
