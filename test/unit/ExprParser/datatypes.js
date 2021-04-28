/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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
const Scalar = require('../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('available datatypes', () => {
        const type = Parser.Type.LITERAL;

        it('parses double-quoted strings', () => {
            const literal = Parser.parse('"foo"', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            expect(Buffer.from(literal.output.getVString().getValue()).toString()).to.equal('foo');
        });

        it('parses single-quoted strings', () => {
            const literal = Parser.parse("'bar'", { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            expect(Buffer.from(literal.output.getVString().getValue()).toString()).to.equal('bar');
        });

        it('parses integers', () => {
            const literal = Parser.parse('1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_UINT);
            expect(literal.output.getVUnsignedInt()).to.equal(1);
        });

        it('parses negative integers', () => {
            const literal = Parser.parse('-1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_SINT);
            expect(literal.output.getVSignedInt()).to.equal(-1);
        });

        it('parses doubles', () => {
            const literal = Parser.parse('1.11111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(1.11111111);
        });

        it('parses negative doubles', () => {
            const literal = Parser.parse('-1.11111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(-1.11111111);
        });

        it('parses floats as doubles', () => {
            let literal = Parser.parse('1.1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(1.1);

            literal = Parser.parse('1.1111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(1.1111111);
        });

        it('parses negative floats as doubles', () => {
            let literal = Parser.parse('-1.1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(-1.1);

            literal = Parser.parse('-1.1111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(-1.1111111);
        });

        it('parses booleans', () => {
            let literal = Parser.parse('true', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_BOOL);
            expect(literal.output.getVBool()).to.equal(true);

            literal = Parser.parse('false', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_BOOL);
            expect(literal.output.getVBool()).to.equal(false);
        });

        it('parses `null`', () => {
            const literal = Parser.parse('null', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_NULL);
        });

        it('does not lose precision for big numbers', () => {
            let overflow = Number.MAX_SAFE_INTEGER + 1;
            let literal = Parser.parse(`${overflow}`, { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            expect(Buffer.from(literal.output.getVString().getValue()).toString()).to.equal(`${overflow}`);

            overflow = Number.MIN_SAFE_INTEGER - 1;
            literal = Parser.parse(`${overflow}`, { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            expect(Buffer.from(literal.output.getVString().getValue()).toString()).to.equal(`${overflow}`);
        });
    });
});
