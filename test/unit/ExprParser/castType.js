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
    context('castType', () => {
        const parser = Parser({ type: Parser.Type.CAST_TYPE });

        it('parses an INTEGER type spec', () => {
            expect(parser.parse('SIGNED')).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(parser.parse('signed')).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(parser.parse('SIGNED INTEGER')).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(parser.parse('signed integer')).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(parser.parse('UNSIGNED')).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            expect(parser.parse('unsigned')).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            expect(parser.parse('UNSIGNED INTEGER')).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            return expect(parser.parse('unsigned INTEGER')).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
        });

        it('parses a CHAR type spec', () => {
            expect(parser.parse('CHAR')).to.deep.equal({ type: 'castType', value: 'CHAR' });
            expect(parser.parse('char')).to.deep.equal({ type: 'castType', value: 'CHAR' });
            expect(parser.parse('CHAR(3)')).to.deep.equal({ type: 'castType', value: 'CHAR(3)' });
            return expect(parser.parse('char(3)')).to.deep.equal({ type: 'castType', value: 'CHAR(3)' });
        });

        it('parses a BINARY type spec', () => {
            expect(parser.parse('BINARY')).to.deep.equal({ type: 'castType', value: 'BINARY' });
            expect(parser.parse('binary')).to.deep.equal({ type: 'castType', value: 'BINARY' });
            expect(parser.parse('BINARY(3)')).to.deep.equal({ type: 'castType', value: 'BINARY(3)' });
            return expect(parser.parse('binary(3)')).to.deep.equal({ type: 'castType', value: 'BINARY(3)' });
        });

        it('parses a DECIMAL type spec', () => {
            expect(parser.parse('DECIMAL')).to.deep.equal({ type: 'castType', value: 'DECIMAL' });
            expect(parser.parse('decimal')).to.deep.equal({ type: 'castType', value: 'DECIMAL' });
            expect(parser.parse('DECIMAL(3)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3)' });
            expect(parser.parse('decimal(3)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3)' });
            expect(parser.parse('DECIMAL(3, 5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal(3, 5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('DECIMAL(3,5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal(3,5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('DECIMAL( 3, 5 )')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal( 3, 5 )')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('DECIMAL(3,5 )')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal(3,5 )')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('DECIMAL( 3,5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal( 3,5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('DECIMAL( 3, 5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(parser.parse('decimal( 3, 5)')).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
        });

        it('parses a TIME type spec', () => {
            expect(parser.parse('TIME')).to.deep.equal({ type: 'castType', value: 'TIME' });
            expect(parser.parse('time')).to.deep.equal({ type: 'castType', value: 'TIME' });
        });

        it('parses a DATETIME type spec', () => {
            expect(parser.parse('DATETIME')).to.deep.equal({ type: 'castType', value: 'DATETIME' });
            expect(parser.parse('datetime')).to.deep.equal({ type: 'castType', value: 'DATETIME' });
        });

        it('parses a DATE type spec', () => {
            expect(parser.parse('DATE')).to.deep.equal({ type: 'castType', value: 'DATE' });
            expect(parser.parse('date')).to.deep.equal({ type: 'castType', value: 'DATE' });
        });

        it('parses a JSON type spec', () => {
            expect(parser.parse('JSON')).to.deep.equal({ type: 'castType', value: 'JSON' });
            expect(parser.parse('json')).to.deep.equal({ type: 'castType', value: 'JSON' });
        });
    });
});
