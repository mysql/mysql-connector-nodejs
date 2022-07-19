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

describe('X DevAPI expression encoder for operators', () => {
    context('with a single fixed parameter', () => {
        it('returns a valid protobuf message for negation expressions', () => {
            const proto = mysqlx.expr('NOT FALSE');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(1);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            return expect(params[0].getLiteral().getVBool()).to.be.false;
        });
    });

    context('with two fixed parameters', () => {
        it('returns a valid protobuf message for a type cast expression', () => {
            // castOp
            const proto = mysqlx.expr('CAST(foo AS CHAR(3))');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cast');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            const documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_OCTETS);
            return expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('CHAR(3)');
        });

        it('returns a valid protobuf message for an arithmetic expression', () => {
            // mulDivExpr
            let proto = mysqlx.expr('-5 * 4');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('*');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_SINT);
            expect(params[0].getLiteral().getVSignedInt()).to.equal(-5);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(4);

            proto = mysqlx.expr('4 % 2');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('%');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            // addSubExpr
            proto = mysqlx.expr('2 + 1');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('+');

            params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            return expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
        });

        it('returns a valid protobuf message for a bit shifting expression', () => {
            // shiftExpr
            const proto = mysqlx.expr('4 >> 2');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('>>');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(4);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(2);
        });

        it('returns a valid protobuf message for a bitwise operator expression', () => {
            // bitExpr
            const proto = mysqlx.expr('29 & 15');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('&');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(29);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(15);
        });

        it('returns a valid protobuf message for comparison expressions', () => {
            // compExpr
            let proto = mysqlx.expr('foo = :v');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('==');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            let documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.PLACEHOLDER);
            expect(params[1].getPosition()).to.equal(0);

            proto = mysqlx.expr('foo = "_"');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('==');
            params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('_');

            proto = mysqlx.expr('1 <> 2');

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('!=');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            proto = mysqlx.expr('foo is true');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('is');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getValue()).to.equal('foo');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            // eslint-disable-next-line no-unused-expressions
            expect(params[1].getLiteral().getVBool()).to.be.true;

            proto = mysqlx.expr('true is not false');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('is_not');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            });

            // eslint-disable-next-line no-unused-expressions
            expect(params[0].getLiteral().getVBool()).to.be.true;
            // eslint-disable-next-line no-unused-expressions
            expect(params[1].getLiteral().getVBool()).to.be.false;

            proto = mysqlx.expr('null IS NULL');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('is');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_NULL);
            });

            proto = mysqlx.expr("'foobar' like '%foo%'");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('like');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            });

            expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('%foo%');

            proto = mysqlx.expr("'foobar' NOT LIKE '%quux%'");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not_like');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            });

            proto = mysqlx.expr("'foobar!' REGEXP '.*'");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('regexp');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            });

            expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar!');
            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('.*');

            proto = mysqlx.expr("'foobar' not regexp '^q.*'");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not_regexp');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            });

            expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('^q.*');

            proto = mysqlx.expr('not = foo');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('==');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.IDENT));

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('not');

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            proto = mysqlx.expr('$."foo bar"."baz**" = $');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('==');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(2);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo bar');
            expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[1].getValue()).to.equal('baz**');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(0);

            proto = mysqlx.expr('$ = {"a":1}');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('==');

            params = proto.getOperator().getParamList();
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            const fields = params[1].getObject().getFldList();
            expect(fields).to.have.lengthOf(1);
            expect(fields[0].getKey()).to.equal('a');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            return expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);
        });

        it('returns a valid protobuf message for composition expressions', () => {
            // andExpr
            const proto = mysqlx.expr('foo = :v1 AND bar = :v2');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('&&');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.length(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OPERATOR);

            let subParams = params[0].getOperator().getParamList();
            expect(subParams).to.have.lengthOf(2);
            expect(subParams[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            let documentPath = subParams[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            expect(subParams[1].getType()).to.equal(ExprStub.Expr.Type.PLACEHOLDER);
            expect(subParams[1].getPosition()).to.equal(0);

            subParams = params[1].getOperator().getParamList();
            expect(subParams).to.have.lengthOf(2);
            expect(subParams[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = subParams[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('bar');

            expect(subParams[1].getType()).to.equal(ExprStub.Expr.Type.PLACEHOLDER);
            expect(subParams[1].getPosition()).to.equal(1);

            // orExpr
        });

        it('returns a valid protobuf syntax for overlap checking expressions', () => {
            let proto = mysqlx.expr('[1, 2, 3] OVERLAPS $.foo');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('overlaps');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            let values = params[0].getArray().getValueList();
            expect(values).to.have.lengthOf(3);

            values.forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(values[1].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(values[2].getLiteral().getVUnsignedInt()).to.equal(3);

            let documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            proto = mysqlx.expr('foo OVERLAPS [4]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('overlaps');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            values = params[1].getArray().getValueList();
            expect(values).to.have.lengthOf(1);
            expect(values[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(values[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(4);

            proto = mysqlx.expr('[6, 7] NOT OVERLAPS foo');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not_overlaps');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            values = params[0].getArray().getValueList();
            expect(values).to.have.lengthOf(2);

            values.forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(6);
            expect(values[1].getLiteral().getVUnsignedInt()).to.equal(7);

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            proto = mysqlx.expr('$.foo NOT OVERLAPS [8, 9]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not_overlaps');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('foo');

            values = params[1].getArray().getValueList();
            expect(values).to.have.lengthOf(2);

            values.forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(8);
            return expect(values[1].getLiteral().getVUnsignedInt()).to.equal(9);
        });

        it('returns a valid protobuf syntax for array lookup expressions', () => {
            let proto = mysqlx.expr('1 in [1,2,3]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            let options = params[1].getArray().getValueList();
            expect(options).to.have.lengthOf(3);
            options.forEach((option, index) => {
                expect(option.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(option.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
                expect(option.getLiteral().getVUnsignedInt()).to.equal(index + 1);
            });

            proto = mysqlx.expr('[1] in [[1],[2],[3]]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            const selector = params[0].getArray().getValueList();
            expect(selector).to.have.lengthOf(1);
            expect(selector[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(selector[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(selector[0].getLiteral().getVUnsignedInt()).to.equal(1);

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            options = params[1].getArray().getValueList();
            expect(options).to.have.lengthOf(3);
            options.forEach((option, index) => {
                expect(option.getType()).to.equal(ExprStub.Expr.Type.ARRAY);
                expect(option.getArray().getValueList()).to.have.length(1);
                expect(option.getArray().getValueList()[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(option.getArray().getValueList()[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
                expect(option.getArray().getValueList()[0].getLiteral().getVUnsignedInt()).to.equal(index + 1);
            });

            proto = mysqlx.expr("'DocumentStore' in categories");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);

            const literal = params[0].getLiteral();
            expect(literal.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(literal.getVString().getValue()).toString()).to.equal('DocumentStore');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            let documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('categories');

            proto = mysqlx.expr('author NOT IN reviewers');

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('not_cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.IDENT));

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('author');

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('reviewers');

            proto = mysqlx.expr('user in [45, 46]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('user');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            let values = params[1].getArray().getValueList();
            expect(values).to.have.lengthOf(2);
            values.forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(45);
            expect(values[1].getLiteral().getVUnsignedInt()).to.equal(46);

            proto = mysqlx.expr('1 in field.array');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(2);
            documentPath.forEach(pathItem => expect(pathItem.getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER));
            expect(documentPath[0].getValue()).to.equal('field');
            expect(documentPath[1].getValue()).to.equal('array');

            proto = mysqlx.expr('field in [1,2,3]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            let args = params[1].getArray().getValueList();
            expect(args).to.have.lengthOf(3);
            args.forEach(arg => {
                expect(arg.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(arg.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });
            expect(args[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(args[1].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(args[2].getLiteral().getVUnsignedInt()).to.equal(3);

            proto = mysqlx.expr('{"a":1} in $');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            let fields = params[0].getObject().getFldList();
            expect(fields).to.have.lengthOf(1);
            expect(fields[0].getKey()).to.equal('a');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

            proto = mysqlx.expr('$.field1 in $.field2');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            params.forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.IDENT));

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field1');

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field2');

            proto = mysqlx.expr('(1>5) in [true, false]');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(params[0].getOperator().getName()).to.equal('>');

            args = params[0].getOperator().getParamList();
            expect(args).to.have.lengthOf(2);
            args.forEach(arg => {
                expect(arg.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(arg.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });
            expect(args[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(args[1].getLiteral().getVUnsignedInt()).to.equal(5);

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            args = params[1].getArray().getValueList();
            expect(args).to.have.lengthOf(2);
            args.forEach(arg => {
                expect(arg.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(arg.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            });
            // eslint-disable-next-line no-unused-expressions
            expect(args[0].getLiteral().getVBool()).to.be.true;
            // eslint-disable-next-line no-unused-expressions
            expect(args[1].getLiteral().getVBool()).to.be.false;

            const config = { mode: mysqlx.Mode.TABLE };

            proto = mysqlx.expr("cast(column as json) in doc->'$.field.array'", config);
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(params[0].getOperator().getName()).to.equal('cast');

            args = params[0].getOperator().getParamList();
            expect(args).to.have.lengthOf(2);
            expect(args[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(args[0].getIdentifier().getName()).to.equal('column');
            expect(args[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(args[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(args[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_OCTETS);
            expect(Buffer.from(args[1].getLiteral().getVOctets().getValue()).toString()).to.equal('JSON');
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getIdentifier().getName()).to.equal('doc');

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(2);
            documentPath.forEach(pathItem => expect(pathItem.getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER));
            expect(documentPath[0].getValue()).to.equal('field');
            expect(documentPath[1].getValue()).to.equal('array');

            proto = mysqlx.expr("column->'$.field' in [1,2,3]", config);
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[0].getIdentifier().getName()).to.equal('column');

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            values = params[1].getArray().getValueList();
            expect(values).to.have.lengthOf(3);
            values.forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });
            expect(values[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(values[1].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(values[2].getLiteral().getVUnsignedInt()).to.equal(3);

            proto = mysqlx.expr('{"a":1} in doc->\'$\'', config);
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            fields = params[0].getObject().getFldList();
            expect(fields).to.have.lengthOf(1);
            expect(fields[0].getKey()).to.equal('a');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getIdentifier().getName()).to.equal('doc');
            expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

            proto = mysqlx.expr("tab1.doc->'$.field1' in tab2.doc->'$.field2'", config);
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('cont_in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(2);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[0].getIdentifier().getTableName()).to.equal('tab1');
            expect(params[0].getIdentifier().getName()).to.equal('doc');

            documentPath = params[0].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field1');

            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[1].getIdentifier().getTableName()).to.equal('tab2');
            expect(params[1].getIdentifier().getName()).to.equal('doc');

            documentPath = params[1].getIdentifier().getDocumentPathList();
            expect(documentPath).to.have.lengthOf(1);
            expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(documentPath[0].getValue()).to.equal('field2');
        });
    });

    context('encoding three fixed parameters', () => {
        it('returns a valid protobuf message for a like expression containing escape characters', () => {
            const proto = mysqlx.expr("'foo%' LIKE 'foo!%' ESCAPE '!'");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('like');

            const params = proto.getOperator().getParamList();
            expect(params).to.have.length(3);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foo%');
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('foo!%');
            expect(params[2].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            return expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('!');
        });

        it('returns a valid protobuf message for an interval expression', () => {
            let proto = mysqlx.expr('CURTIME() + INTERVAL 250 MICROSECOND');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('date_add');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.length(3);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);
            expect(params[0].getFunctionCall().getName().getName()).to.equal('CURTIME');
            expect(params[0].getFunctionCall().getParamList()).to.have.lengthOf(0);
            expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(250);
            expect(params[2].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('MICROSECOND');

            // date_add(date_add(date_add('2000-12-31 23:59:59', INTERVAL 30 SECOND), INTERVAL 4 HOUR), INTERVAL 8 DAY)
            proto = mysqlx.expr("'2000-12-31 23:59:59' + INTERVAL 30 SECOND + INTERVAL 4 HOUR + INTERVAL 8 DAY");
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('date_add');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(3);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(params[0].getOperator().getName()).to.equal('date_add');

            params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL));
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(8);
            expect(params[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('DAY');

            params = params[0].getOperator().getParamList();
            expect(params).to.have.lengthOf(3);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(params[0].getOperator().getName()).to.equal('date_add');

            params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL));
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(4);
            expect(params[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('HOUR');

            params = params[0].getOperator().getParamList();
            expect(params).to.have.lengthOf(3);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(params[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('2000-12-31 23:59:59');

            params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL));
            expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(30);
            expect(params[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('SECOND');
        });

        it('returns a balid protobuf message for a range expression', () => {
            let proto = mysqlx.expr('4 BETWEEN 2 AND 6');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('between');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(3);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(4);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(params[2].getLiteral().getVUnsignedInt()).to.equal(6);

            proto = mysqlx.expr('1 not between 9 AND 10');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('between_not');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(3);
            params.forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(9);
            return expect(params[2].getLiteral().getVUnsignedInt()).to.equal(10);
        });
    });

    context('with a variable number of parameters', () => {
        it('returns a valid protobuf message for existence checking expressions', () => {
            // ilriExpr
            let proto = mysqlx.expr('field in (1,2,3)');

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('in');

            let params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(4);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(1);
            expect(params[0].getIdentifier().getDocumentPathList()[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(params[0].getIdentifier().getDocumentPathList()[0].getValue()).to.equal('field');

            params.slice(1, params.length).forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
            expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

            proto = mysqlx.expr("field in ('one', 'two', 'three')");

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
            expect(proto.getOperator().getName()).to.equal('in');

            params = proto.getOperator().getParamList();
            expect(params).to.have.lengthOf(4);
            expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);
            expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(1);
            expect(params[0].getIdentifier().getDocumentPathList()[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
            expect(params[0].getIdentifier().getDocumentPathList()[0].getValue()).to.equal('field');

            params.slice(1, params.length).forEach(param => {
                expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            });

            expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('one');
            expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('two');
            return expect(Buffer.from(params[3].getLiteral().getVString().getValue()).toString()).to.equal('three');
        });
    });
});
