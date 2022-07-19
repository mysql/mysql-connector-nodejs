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

const ExprStub = require('../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
const ScalarStub = require('../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

describe('X DevAPI expression encoder for literals', () => {
    it('returns a valid protobuf message for a safe number', () => {
        let safe = 3;
        let proto = mysqlx.expr(`${safe}`);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(proto.getLiteral().getVUnsignedInt()).to.equal(safe);

        safe = -3;
        proto = mysqlx.expr(`${safe}`);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_SINT);
        expect(proto.getLiteral().getVSignedInt()).to.equal(safe);

        safe = 1.234;
        proto = mysqlx.expr(`${safe}`);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_DOUBLE);
        return expect(proto.getLiteral().getVDouble()).to.equal(safe);
    });

    it('returns a valid protobuf message for an unsafe number', () => {
        let unsafe = `${Number.MAX_SAFE_INTEGER + 1}`;
        let proto = mysqlx.expr(unsafe);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(proto.getLiteral().getVString().getValue()).toString()).to.equal(unsafe);

        unsafe = '1.23456789234567892';
        proto = mysqlx.expr(unsafe);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        return expect(Buffer.from(proto.getLiteral().getVString().getValue()).toString()).to.equal(unsafe);
    });

    it('returns a valid protobuf message for a boolean', () => {
        let proto = mysqlx.expr('TRUE');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        // eslint-disable-next-line no-unused-expressions
        expect(proto.getLiteral().getVBool()).to.be.true;

        proto = mysqlx.expr('FALSE');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        return expect(proto.getLiteral().getVBool()).to.be.false;
    });

    it('returns a valid protobuf message for NULL', () => {
        const proto = mysqlx.expr('NULL');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        return expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_NULL);
    });

    it('returns a valid protobuf message for double-quoted literals', () => {
        let proto = mysqlx.expr('"foo\'bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        let literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal("foo'bar");

        proto = mysqlx.expr('"foo\'\'bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal("foo''bar");

        proto = mysqlx.expr('""""');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('"');

        proto = mysqlx.expr('""');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('');

        proto = mysqlx.expr('"foo\u005C"bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('foo"bar');

        proto = mysqlx.expr('"foo""bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('foo"bar');

        proto = mysqlx.expr('"\u005C\u005C&quot"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        return expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('\u005C&quot');
    });

    it('returns a valid protobuf message for single-quoted literals', () => {
        let proto = mysqlx.expr('\'foo"bar\'');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        let literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('foo"bar');

        proto = mysqlx.expr('\'foo""bar\'');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('foo""bar');

        proto = mysqlx.expr("''");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('');

        proto = mysqlx.expr("'foo\u005C'bar'");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal("foo'bar");

        proto = mysqlx.expr("'foo''bar'");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal("foo'bar");

        proto = mysqlx.expr("'\u005C\u005C&quot'");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        literal = proto.getLiteral();
        expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        return expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('\u005C&quot');
    });
});
