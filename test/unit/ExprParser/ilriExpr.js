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
    context('ilriExpr', () => {
        const parser = Parser({ type: Parser.Type.ILRI_EXPR });

        it('parses boolean test functions and the corresponding parameters', () => {
            expect(parser.parse('false IS NOT false')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'is_not',
                    params: [{
                        type: 'literal',
                        value: false
                    }, {
                        type: 'literal',
                        value: false
                    }]
                }
            });

            return expect(parser.parse('foo IS TRUE')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'is',
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
                        value: true
                    }]
                }
            });
        });

        it('parses existence functions and the corresponding parameters', () => {
            expect(parser.parse("'foo' IN ('foo','bar')")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'in',
                    params: [{
                        type: 'literal',
                        value: 'foo'
                    }, {
                        type: 'literal',
                        value: 'foo'
                    }, {
                        type: 'literal',
                        value: 'bar'
                    }]
                }
            });

            return expect(parser.parse('foo NOT IN (1, 2)')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'not_in',
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
                        value: 1
                    }, {
                        type: 'literal',
                        value: 2
                    }]
                }
            });
        });

        it('parses list lookup functions and the corresponding parameters', () => {
            expect(parser.parse('1 IN [foo, bar]')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'cont_in',
                    params: [{
                        type: 'literal',
                        value: 1
                    }, {
                        type: 'jsonArray',
                        value: [{
                            type: 'documentField',
                            value: {
                                documentPath: [{
                                    type: 'member',
                                    value: 'foo'
                                }]
                            }
                        }, {
                            type: 'documentField',
                            value: {
                                documentPath: [{
                                    type: 'member',
                                    value: 'bar'
                                }]
                            }
                        }]
                    }]
                }
            });

            return expect(parser.parse('foo NOT IN [1, 2]')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'not_cont_in',
                    params: [{
                        type: 'documentField',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'foo'
                            }]
                        }
                    }, {
                        type: 'jsonArray',
                        value: [{
                            type: 'literal',
                            value: 1
                        }, {
                            type: 'literal',
                            value: 2
                        }]
                    }]
                }
            });
        });

        it('parses similarity functions and the corresponding parameters', () => {
            expect(parser.parse("foo LIKE '%bar%'")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'like',
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
                        value: '%bar%'
                    }]
                }
            });

            expect(parser.parse("'foobar' NOT LIKE '%baz%'")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'not_like',
                    params: [{
                        type: 'literal',
                        value: 'foobar'
                    }, {
                        type: 'literal',
                        value: '%baz%'
                    }]
                }
            });

            return expect(parser.parse("'foo%' LIKE 'foo!%' ESCAPE '!'")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'like',
                    params: [{
                        type: 'literal',
                        value: 'foo%'
                    }, {
                        type: 'literal',
                        value: 'foo!%'
                    }, {
                        type: 'literal',
                        value: '!'
                    }]
                }
            });
        });

        it('parses range functions and the corresponding parameters', () => {
            expect(parser.parse('2 BETWEEN 1 AND 3')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'between',
                    params: [{
                        type: 'literal',
                        value: 2
                    }, {
                        type: 'literal',
                        value: 1
                    }, {
                        type: 'literal',
                        value: 3
                    }]
                }
            });

            return expect(parser.parse('5 NOT BETWEEN 8 AND 10')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'between_not',
                    params: [{
                        type: 'literal',
                        value: 5
                    }, {
                        type: 'literal',
                        value: 8
                    }, {
                        type: 'literal',
                        value: 10
                    }]
                }
            });
        });

        it('parses regular expression matching functions and the corresponding parameters', () => {
            expect(parser.parse("'foo' REGEXP '.*'")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'regexp',
                    params: [{
                        type: 'literal',
                        value: 'foo'
                    }, {
                        type: 'literal',
                        value: '.*'
                    }]
                }
            });

            expect(parser.parse("'foo' NOT REGEXP '[0-9]+'")).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'not_regexp',
                    params: [{
                        type: 'literal',
                        value: 'foo'
                    }, {
                        type: 'literal',
                        value: '[0-9]+'
                    }]
                }
            });
        });

        it('parses overlap checking functions and the corresponding parameters', () => {
            expect(parser.parse('[1, 2] OVERLAPS [1, 2, 3]')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'overlaps',
                    params: [{
                        type: 'jsonArray',
                        value: [{
                            type: 'literal',
                            value: 1
                        }, {
                            type: 'literal',
                            value: 2
                        }]
                    }, {
                        type: 'jsonArray',
                        value: [{
                            type: 'literal',
                            value: 1
                        }, {
                            type: 'literal',
                            value: 2
                        }, {
                            type: 'literal',
                            value: 3
                        }]
                    }]
                }
            });

            return expect(parser.parse('[4, 5] NOT OVERLAPS [1, 2]')).to.deep.equal({
                type: 'ilriExpr',
                value: {
                    name: 'not_overlaps',
                    params: [{
                        type: 'jsonArray',
                        value: [{
                            type: 'literal',
                            value: 4
                        }, {
                            type: 'literal',
                            value: 5
                        }]
                    }, {
                        type: 'jsonArray',
                        value: [{
                            type: 'literal',
                            value: 1
                        }, {
                            type: 'literal',
                            value: 2
                        }]
                    }]
                }
            });
        });
    });
});
