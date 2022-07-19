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
        const type = Parser.Type.CAST_TYPE;

        it('parses an INTEGER type spec', () => {
            expect(Parser.parse('SIGNED', { type })).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(Parser.parse('signed', { type })).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(Parser.parse('SIGNED INTEGER', { type })).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(Parser.parse('signed integer', { type })).to.deep.equal({ type: 'castType', value: 'SIGNED' });
            expect(Parser.parse('UNSIGNED', { type })).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            expect(Parser.parse('unsigned', { type })).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            expect(Parser.parse('UNSIGNED INTEGER', { type })).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
            return expect(Parser.parse('unsigned INTEGER', { type })).to.deep.equal({ type: 'castType', value: 'UNSIGNED' });
        });

        it('parses a CHAR type spec', () => {
            expect(Parser.parse('CHAR', { type })).to.deep.equal({ type: 'castType', value: 'CHAR' });
            expect(Parser.parse('char', { type })).to.deep.equal({ type: 'castType', value: 'CHAR' });
            expect(Parser.parse('CHAR(3)', { type })).to.deep.equal({ type: 'castType', value: 'CHAR(3)' });
            return expect(Parser.parse('char(3)', { type })).to.deep.equal({ type: 'castType', value: 'CHAR(3)' });
        });

        it('parses a BINARY type spec', () => {
            expect(Parser.parse('BINARY', { type })).to.deep.equal({ type: 'castType', value: 'BINARY' });
            expect(Parser.parse('binary', { type })).to.deep.equal({ type: 'castType', value: 'BINARY' });
            expect(Parser.parse('BINARY(3)', { type })).to.deep.equal({ type: 'castType', value: 'BINARY(3)' });
            return expect(Parser.parse('binary(3)', { type })).to.deep.equal({ type: 'castType', value: 'BINARY(3)' });
        });

        it('parses a DECIMAL type spec', () => {
            expect(Parser.parse('DECIMAL', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL' });
            expect(Parser.parse('decimal', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL' });
            expect(Parser.parse('DECIMAL(3)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3)' });
            expect(Parser.parse('decimal(3)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3)' });
            expect(Parser.parse('DECIMAL(3, 5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal(3, 5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('DECIMAL(3,5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal(3,5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('DECIMAL( 3, 5 )', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal( 3, 5 )', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('DECIMAL(3,5 )', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal(3,5 )', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('DECIMAL( 3,5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal( 3,5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('DECIMAL( 3, 5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
            expect(Parser.parse('decimal( 3, 5)', { type })).to.deep.equal({ type: 'castType', value: 'DECIMAL(3,5)' });
        });

        it('parses a TIME type spec', () => {
            expect(Parser.parse('TIME', { type })).to.deep.equal({ type: 'castType', value: 'TIME' });
            expect(Parser.parse('time', { type })).to.deep.equal({ type: 'castType', value: 'TIME' });
        });

        it('parses a DATETIME type spec', () => {
            expect(Parser.parse('DATETIME', { type })).to.deep.equal({ type: 'castType', value: 'DATETIME' });
            expect(Parser.parse('datetime', { type })).to.deep.equal({ type: 'castType', value: 'DATETIME' });
        });

        it('parses a DATE type spec', () => {
            expect(Parser.parse('DATE', { type })).to.deep.equal({ type: 'castType', value: 'DATE' });
            expect(Parser.parse('date', { type })).to.deep.equal({ type: 'castType', value: 'DATE' });
        });

        it('parses a JSON type spec', () => {
            expect(Parser.parse('JSON', { type })).to.deep.equal({ type: 'castType', value: 'JSON' });
            expect(Parser.parse('json', { type })).to.deep.equal({ type: 'castType', value: 'JSON' });
        });
    });
});
