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
    context('documentField', () => {
        const type = Parser.Type.DOCUMENT_FIELD;

        context('when the field identifier contains the scope', () => {
            it('parses the root path to a field in a document', () => {
                return expect(Parser.parse('$', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: []
                    }
                });
            });

            it('parses the path to all top-level fields in a document', () => {
                return expect(Parser.parse('$.*', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'memberAsterisk'
                        }]
                    }
                });
            });

            it('parses the path to a nested field in a document', () => {
                const path = {
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                };

                expect(Parser.parse('$.foo.bar', { type })).to.deep.equal(path);
            });

            it('parses the path to an array element', () => {
                return expect(Parser.parse('$.foo[3]', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndex',
                            value: 3
                        }]
                    }
                });
            });

            it('parses the path to all the elements of an array', () => {
                expect(Parser.parse('$.foo[*]', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndexAsterisk'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within an array', () => {
                return expect(Parser.parse('$.foo[3].bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndex',
                            value: 3
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within multiple array elements', () => {
                return expect(Parser.parse('$.foo[*].bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndexAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to all fields within the range of a wildcard', () => {
                return expect(Parser.parse('$.foo.*', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'memberAsterisk'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within the range of a wildcard', () => {
                return expect(Parser.parse('$.foo.*.bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'memberAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to a specific field linked by a globstar', () => {
                return expect(Parser.parse('$.foo**.bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'doubleAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('fails to parse a path to multiple fields linked by a globstar', () => {
                expect(() => Parser.parse('$**', { type })).to.throw();
                return expect(() => Parser.parse('$.foo**', { type })).to.throw();
            });
        });

        context('when the field identifier does not contain the scope', () => {
            it('fails to parse the path to all top-level fields in a document', () => {
                return expect(() => Parser.parse('*', { type })).to.throw();
            });

            it('parses the path to a nested field in a document', () => {
                expect(Parser.parse('foo.bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to an array element', () => {
                return expect(Parser.parse('foo[3]', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndex',
                            value: 3
                        }]
                    }
                });
            });

            it('parses the path to all the elements of an array', () => {
                expect(Parser.parse('foo[*]', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndexAsterisk'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within an array', () => {
                return expect(Parser.parse('foo[3].bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndex',
                            value: 3
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within multiple array elements', () => {
                return expect(Parser.parse('foo[*].bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'arrayIndexAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to all fields within the range of a wildcard', () => {
                return expect(Parser.parse('foo.*', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'memberAsterisk'
                        }]
                    }
                });
            });

            it('parses the path to a specific field within the range of a wildcard', () => {
                return expect(Parser.parse('foo.*.bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'memberAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('parses the path to a specific field linked by a globstar', () => {
                return expect(Parser.parse('foo**.bar', { type })).to.deep.equal({
                    type: 'documentField',
                    value: {
                        documentPath: [{
                            type: 'member',
                            value: 'foo'
                        }, {
                            type: 'doubleAsterisk'
                        }, {
                            type: 'member',
                            value: 'bar'
                        }]
                    }
                });
            });

            it('fails to parse a path to multiple fields linked by a globstar', () => {
                expect(() => Parser.parse('**', { type })).to.throw();
                return expect(() => Parser.parse('foo**', { type })).to.throw();
            });
        });

        context('when the field is not valid', () => {
            it('throws the corresponding parsing error', () => {
                expect(() => Parser.parse('$.', { type })).to.throw();
                expect(() => Parser.parse('.doc', { type })).to.throw();
                expect(() => Parser.parse('**', { type })).to.throw();
                expect(() => Parser.parse('**foo', { type })).to.throw();
                expect(() => Parser.parse('_**', { type })).to.throw();
                expect(() => Parser.parse('_**[*]_**._', { type })).to.throw();
                expect(() => Parser.parse('_**[*]._.**._', { type })).to.throw();
                expect(() => Parser.parse('_**[*]_.**._', { type })).to.throw();
                expect(() => Parser.parse('$.foo**', { type })).to.throw();
                expect(() => Parser.parse('$.foo.**.bar', { type })).to.throw();
                expect(() => Parser.parse('$.foo[**]', { type })).to.throw();
                expect(() => Parser.parse('$**', { type })).to.throw();
                expect(() => Parser.parse('$.**', { type })).to.throw();
                expect(() => Parser.parse('$.**bar', { type })).to.throw();
                expect(() => Parser.parse('$.**".bar"', { type })).to.throw();
                expect(() => Parser.parse('$.**.bar', { type })).to.throw();
                expect(() => Parser.parse('$.foo..bar', { type })).to.throw();
                expect(() => Parser.parse('"foo".bar', { type })).to.throw();
                expect(() => Parser.parse('$**.bar()', { type })).to.throw();
                expect(() => Parser.parse('[<foo, bar>]', { type })).to.throw();
                expect(() => Parser.parse('[<"foo", 1>]', { type })).to.throw();
                expect(() => Parser.parse('{<foobar>}', { type })).to.throw();
                // valid expressions in table mode
                expect(() => Parser.parse("doc->'$.foo'")).to.throw();
                return expect(() => Parser.parse("foo.bar->'$.foo'")).to.throw();
            });
        });
    });
});
