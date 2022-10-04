/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

const Parser = require('../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('literal', () => {
        const parser = Parser({ type: Parser.Type.LITERAL });

        it('parses double-quoted strings as JavaScript strings', () => {
            return expect(parser.parse('"foo"')).to.deep.equal({ type: 'literal', value: 'foo' });
        });

        it('parses single-quoted strings as JavaScript strings', () => {
            return expect(parser.parse("'bar'")).to.deep.equal({ type: 'literal', value: 'bar' });
        });

        it('parses safe integers as JavaScript numbers', () => {
            return expect(parser.parse('1')).to.deep.equal({ type: 'literal', value: 1 });
        });

        it('parses positive unsafe integers as JavaScript strings', () => {
            const unsafeInteger = `${Number.MAX_SAFE_INTEGER + 1}`;
            return expect(parser.parse(unsafeInteger)).to.deep.equal({ type: 'literal', value: unsafeInteger });
        });

        it('parses negative safe integers as JavaScript numbers', () => {
            return expect(parser.parse('-1')).to.deep.equal({ type: 'literal', value: -1 });
        });

        it('parses negative unsafe integers as JavaScript strings', () => {
            const unsafeInteger = `${Number.MIN_SAFE_INTEGER - 1}`;
            return expect(parser.parse(unsafeInteger)).to.deep.equal({ type: 'literal', value: unsafeInteger });
        });

        it('parses positive safe decimal values as JavaScript numbers', () => {
            return expect(parser.parse('1.11111111')).to.deep.equal({ type: 'literal', value: 1.11111111 });
        });

        it('parses positive unsafe decimal values as JavaScript strings', () => {
            return expect(parser.parse('1.23456789123456789')).to.deep.equal({ type: 'literal', value: '1.23456789123456789' });
        });

        it('parses negative safe decimal values as JavaScript numbers', () => {
            return expect(parser.parse('-1.11111111')).to.deep.equal({ type: 'literal', value: -1.11111111 });
        });

        it('parses negative unsafe decimal values as JavaScript strings', () => {
            return expect(parser.parse('-1.23456789123456789')).to.deep.equal({ type: 'literal', value: '-1.23456789123456789' });
        });

        it('parses booleans values as JavaScript booleans', () => {
            expect(parser.parse('true')).to.deep.equal({ type: 'literal', value: true });
            expect(parser.parse('TRUE')).to.deep.equal({ type: 'literal', value: true });
            expect(parser.parse('false')).to.deep.equal({ type: 'literal', value: false });
            return expect(parser.parse('FALSE')).to.deep.equal({ type: 'literal', value: false });
        });

        it('parses NULL values as a JavaScript null', () => {
            expect(parser.parse('null')).to.deep.equal({ type: 'literal', value: null });
        });
    });
});
