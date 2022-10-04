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
    context('unaryOp', () => {
        const parser = Parser({ type: Parser.Type.UNARY_OP });

        it('parses a unary operator name and parameter', () => {
            expect(parser.parse('NOT TRUE')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: 'not',
                    params: [{
                        type: 'literal',
                        value: true
                    }]
                }
            });

            expect(parser.parse('!TRUE')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: '!',
                    params: [{
                        type: 'literal',
                        value: true
                    }]
                }
            });

            expect(parser.parse('NOT TRUE')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: 'not',
                    params: [{
                        type: 'literal',
                        value: true
                    }]
                }
            });

            expect(parser.parse('~foo')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: '~',
                    params: [{
                        type: 'documentField',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'foo'
                            }]
                        }
                    }]
                }
            });

            expect(parser.parse('+foo')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: 'sign_plus',
                    params: [{
                        type: 'documentField',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'foo'
                            }]
                        }
                    }]
                }
            });

            expect(parser.parse('-foo')).to.deep.equal({
                type: 'unaryOp',
                value: {
                    name: 'sign_minus',
                    params: [{
                        type: 'documentField',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'foo'
                            }]
                        }
                    }]
                }
            });
        });
    });
});
