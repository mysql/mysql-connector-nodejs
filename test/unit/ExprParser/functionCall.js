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
    context('functionCall', () => {
        const parser = Parser({ type: Parser.Type.FUNCTION_CALL });

        it('parses a function call with a schema-qualified identifier', () => {
            expect(parser.parse('foo.bar("baz")')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'bar',
                        schema: 'foo'
                    },
                    params: [{
                        type: 'literal',
                        value: 'baz'
                    }]
                }
            });

            expect(parser.parse('foo.bar(baz.qux(2.3))')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'bar',
                        schema: 'foo'
                    },
                    params: [{
                        type: 'functionCall',
                        value: {
                            name: {
                                name: 'qux',
                                schema: 'baz'
                            },
                            params: [{
                                type: 'literal',
                                value: 2.3
                            }]
                        }
                    }]
                }
            });

            expect(parser.parse('foo.bar(baz)')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'bar',
                        schema: 'foo'
                    },
                    params: [{
                        type: 'documentField',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }]
                        }
                    }]
                }
            });
        });

        it('parses a function call without a schema-qualified identifier', () => {
            expect(parser.parse('foo(false)')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'foo'
                    },
                    params: [{
                        type: 'literal',
                        value: false
                    }]
                }
            });

            expect(parser.parse('foo(bar(NULL))')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'foo'
                    },
                    params: [{
                        type: 'functionCall',
                        value: {
                            name: {
                                name: 'bar'
                            },
                            params: [{
                                type: 'literal',
                                value: null
                            }]
                        }
                    }]
                }
            });

            expect(parser.parse('foo(:arg)')).to.deep.equal({
                type: 'functionCall',
                value: {
                    name: {
                        name: 'foo'
                    },
                    params: [{
                        type: 'placeholder',
                        value: 'arg'
                    }]
                }
            });
        });
    });
});
