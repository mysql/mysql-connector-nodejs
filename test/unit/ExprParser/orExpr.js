/*
 * Copyright (c) 2022, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

/* eslint-env node, mocha */

const Parser = require('../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('orExpr', () => {
        const parser = Parser({ type: Parser.Type.OR_EXPR });

        it('parses logical OR operators and corresponding parameters', () => {
            expect(parser.parse('foo = :v1 OR bar = :v2')).to.deep.equal({
                type: 'orExpr',
                value: {
                    name: '||',
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

            return expect(parser.parse('foo = :v1 OR bar = :v2 OR baz = :v3')).to.deep.equal({
                type: 'orExpr',
                value: {
                    name: '||',
                    params: [{
                        type: 'orExpr',
                        value: {
                            name: '||',
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
            return expect(parser.parse('foo = :v1 OR bar = :v2 AND baz = :v3')).to.deep.equal({
                type: 'orExpr',
                value: {
                    name: '||',
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
                                                value: 'bar'
                                            }]
                                        }
                                    }, {
                                        type: 'placeholder',
                                        value: 'v2'
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
                    }]
                }
            });
        });
    });
});
