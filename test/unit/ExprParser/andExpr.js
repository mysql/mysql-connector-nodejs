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
    context('andExpr', () => {
        const parser = Parser({ type: Parser.Type.AND_EXPR });

        it('parses logical AND operators and corresponding parameters', () => {
            expect(parser.parse('foo = :v1 AND bar = :v2')).to.deep.equal({
                type: 'andExpr',
                value: {
                    name: '&&',
                    params: [{
                        type: 'compExpr',
                        value: {
                            name: '==',
                            params: [{
                                type: 'documentField',
                                value: {
                                    documentPath: [{
                                        type: 'member',
                                        value: 'foo'
                                    }]
                                }
                            }, {
                                type: 'placeholder',
                                value: 'v1'
                            }]
                        }
                    }, {
                        type: 'compExpr',
                        value: {
                            name: '==',
                            params: [{
                                type: 'documentField',
                                value: {
                                    documentPath: [{
                                        type: 'member',
                                        value: 'bar'
                                    }]
                                }
                            }, {
                                type: 'placeholder',
                                value: 'v2'
                            }]
                        }
                    }]
                }
            });

            return expect(parser.parse('foo = :v1 AND bar = :v2 AND baz = :v3')).to.deep.equal({
                type: 'andExpr',
                value: {
                    name: '&&',
                    params: [{
                        type: 'andExpr',
                        value: {
                            name: '&&',
                            params: [{
                                type: 'compExpr',
                                value: {
                                    name: '==',
                                    params: [{
                                        type: 'documentField',
                                        value: {
                                            documentPath: [{
                                                type: 'member',
                                                value: 'foo'
                                            }]
                                        }
                                    }, {
                                        type: 'placeholder',
                                        value: 'v1'
                                    }]
                                }
                            }, {
                                type: 'compExpr',
                                value: {
                                    name: '==',
                                    params: [{
                                        type: 'documentField',
                                        value: {
                                            documentPath: [{
                                                type: 'member',
                                                value: 'bar'
                                            }]
                                        }
                                    }, {
                                        type: 'placeholder',
                                        value: 'v2'
                                    }]
                                }
                            }]
                        }
                    }, {
                        type: 'compExpr',
                        value: {
                            name: '==',
                            params: [{
                                type: 'documentField',
                                value: {
                                    documentPath: [{
                                        type: 'member',
                                        value: 'baz'
                                    }]
                                }
                            }, {
                                type: 'placeholder',
                                value: 'v3'
                            }]
                        }
                    }]
                }
            });
        });

        it('parses composable operators with the correct precedence', () => {
            expect(parser.parse("TRUE IS NOT FALSE AND 'foobar' LIKE '%foo%'")).to.deep.equal({
                type: 'andExpr',
                value: {
                    name: '&&',
                    params: [{
                        type: 'ilriExpr',
                        value: {
                            name: 'is_not',
                            params: [{
                                type: 'literal',
                                value: true
                            }, {
                                type: 'literal',
                                value: false
                            }]
                        }
                    }, {
                        type: 'ilriExpr',
                        value: {
                            name: 'like',
                            params: [{
                                type: 'literal',
                                value: 'foobar'
                            }, {
                                type: 'literal',
                                value: '%foo%'
                            }]
                        }
                    }]
                }
            });

            return expect(parser.parse("foo REGEXP '[0-9]+' AND bar = 'baz'")).to.deep.equal({
                type: 'andExpr',
                value: {
                    name: '&&',
                    params: [{
                        type: 'ilriExpr',
                        value: {
                            name: 'regexp',
                            params: [{
                                type: 'documentField',
                                value: {
                                    documentPath: [{
                                        type: 'member',
                                        value: 'foo'
                                    }]
                                }
                            }, {
                                type: 'literal',
                                value: '[0-9]+'
                            }]
                        }
                    }, {
                        type: 'compExpr',
                        value: {
                            name: '==',
                            params: [{
                                type: 'documentField',
                                value: {
                                    documentPath: [{
                                        type: 'member',
                                        value: 'bar'
                                    }]
                                }
                            }, {
                                type: 'literal',
                                value: 'baz'
                            }]
                        }
                    }]
                }
            });
        });
    });
});
