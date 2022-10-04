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
    context('bitExpr', () => {
        const parser = Parser({ type: Parser.Type.BIT_EXPR });

        it('parses a bitwise AND and its parameters', () => {
            return expect(parser.parse('29 & 15')).to.deep.equal({
                type: 'bitExpr',
                value: {
                    name: '&',
                    params: [{
                        type: 'literal',
                        value: 29
                    }, {
                        type: 'literal',
                        value: 15
                    }]
                }
            });
        });

        it('parses a bitwise OR and its parameters', () => {
            return expect(parser.parse('29 | 15')).to.deep.equal({
                type: 'bitExpr',
                value: {
                    name: '|',
                    params: [{
                        type: 'literal',
                        value: 29
                    }, {
                        type: 'literal',
                        value: 15
                    }]
                }
            });
        });

        it('parses a bitwise XOR and its parameters', () => {
            return expect(parser.parse('1 ^ 1')).to.deep.equal({
                type: 'bitExpr',
                value: {
                    name: '^',
                    params: [{
                        type: 'literal',
                        value: 1
                    }, {
                        type: 'literal',
                        value: 1
                    }]
                }
            });
        });

        it('parses composable bitwise functions and their parameters with the correct precedence', () => {
            return expect(parser.parse('29 | 15 & 1')).to.deep.equal({
                type: 'bitExpr',
                value: {
                    name: '|',
                    params: [{
                        type: 'literal',
                        value: 29
                    }, {
                        type: 'bitExpr',
                        value: {
                            name: '&',
                            params: [{
                                type: 'literal',
                                value: 15
                            }, {
                                type: 'literal',
                                value: 1
                            }]
                        }
                    }]
                }
            });
        });
    });
});
