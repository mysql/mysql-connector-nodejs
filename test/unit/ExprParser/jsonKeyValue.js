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
    context('jsonKeyValue', () => {
        const type = Parser.Type.JSON_KEY_VALUE;

        it('parses a JSON key mapping to a literal value', () => {
            expect(Parser.parse('"foo": "bar"', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: 'bar'
                    }
                }
            });

            expect(Parser.parse('"foo": 3', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: 3
                    }
                }
            });

            expect(Parser.parse('"foo": -1', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: -1
                    }
                }
            });

            expect(Parser.parse('"foo": 1.234', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: 1.234
                    }
                }
            });

            expect(Parser.parse(`"foo": ${Number.MAX_SAFE_INTEGER + 1}`, { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: `${Number.MAX_SAFE_INTEGER + 1}`
                    }
                }
            });

            expect(Parser.parse(`"foo": ${Number.MIN_SAFE_INTEGER - 1}`, { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: `${Number.MIN_SAFE_INTEGER - 1}`
                    }
                }
            });

            expect(Parser.parse('"foo": true', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: true
                    }
                }
            });

            expect(Parser.parse('"foo": false', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: false
                    }
                }
            });

            return expect(Parser.parse('"foo": null', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'literal',
                        value: null
                    }
                }
            });
        });

        it('parses a JSON key mapping to an object value', () => {
            return expect(Parser.parse('"foo": { "bar": "baz" }', { type })).to.deep.equal({
                type: 'jsonKeyValue',
                value: {
                    foo: {
                        type: 'jsonDoc',
                        value: {
                            bar: {
                                type: 'literal',
                                value: 'baz'
                            }
                        }
                    }
                }
            });
        });
    });
});
