/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

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
