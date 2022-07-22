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

describe('X DevAPI expression encoder for function calls', () => {
    it('returns a valid protobuf message for function calls with schema identifiers', () => {
        let proto = mysqlx.expr('foo.bar("baz", "qux")');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        let fn = proto.getFunctionCall();
        let functionName = fn.getName();
        expect(functionName.getSchemaName()).to.equal('foo');
        expect(functionName.getName()).to.equal('bar');

        let params = fn.getParamList();
        expect(params).to.have.lengthOf(2);
        params.forEach(p => expect(p.getType()).to.equal(ExprStub.Expr.Type.LITERAL));

        let fstParam = params[0].getLiteral();
        expect(fstParam.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(fstParam.getVString().getValue()).toString()).to.equal('baz');

        const sndParam = params[1].getLiteral();
        expect(sndParam.getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(sndParam.getVString().getValue()).toString()).to.equal('qux');

        proto = mysqlx.expr('foo.bar(baz)');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        fn = proto.getFunctionCall();
        functionName = fn.getName();
        expect(functionName.getSchemaName()).to.equal('foo');
        expect(functionName.getName()).to.equal('bar');

        params = fn.getParamList();
        expect(params).to.have.lengthOf(1);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.IDENT);

        fstParam = params[0].getIdentifier();
        const documentPath = fstParam.getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        return expect(documentPath[0].getValue()).to.equal('baz');
    });

    it('returns a valid protobuf message for function calls without schema identifiers', () => {
        let proto = mysqlx.expr('foo(1)');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        let fn = proto.getFunctionCall();
        let functionName = fn.getName();
        // eslint-disable-next-line no-unused-expressions
        expect(functionName.getSchemaName()).to.be.a('string').and.be.empty;
        expect(functionName.getName()).to.equal('foo');

        let params = fn.getParamList();
        expect(params).to.have.lengthOf(1);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        let fstParam = params[0].getLiteral();
        expect(fstParam.getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(fstParam.getVUnsignedInt()).to.equal(1);

        proto = mysqlx.expr('foo(bar(TRUE))');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        fn = proto.getFunctionCall();
        functionName = fn.getName();
        // eslint-disable-next-line no-unused-expressions
        expect(functionName.getSchemaName()).to.be.a('string').and.be.empty;
        expect(functionName.getName()).to.equal('foo');

        params = fn.getParamList();
        expect(params).to.have.lengthOf(1);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        fn = params[0].getFunctionCall();
        functionName = fn.getName();
        // eslint-disable-next-line no-unused-expressions
        expect(functionName.getSchemaName()).to.be.a('string').and.be.empty;
        expect(functionName.getName()).to.equal('bar');

        params = fn.getParamList();
        expect(params).to.have.lengthOf(1);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.LITERAL);

        fstParam = params[0].getLiteral();
        expect(fstParam.getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        // eslint-disable-next-line no-unused-expressions
        expect(fstParam.getVBool()).to.be.true;

        proto = mysqlx.expr("substr('foobar', 1, 3) = 'foo'");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
        expect(proto.getOperator().getName()).to.equal('==');

        params = proto.getOperator().getParamList();
        expect(params).to.have.lengthOf(2);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        let functionCall = params[0].getFunctionCall();
        expect(functionCall.getName().getName()).to.equal('substr');

        let args = functionCall.getParamList();
        expect(args).to.have.lengthOf(3);
        args.forEach(param => expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL));
        expect(args[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(args[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
        expect(args[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(args[1].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(args[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(args[2].getLiteral().getVUnsignedInt()).to.equal(3);

        expect(params[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(params[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('foo');

        proto = mysqlx.expr("jcast(concat('[', 1, ',', 2, ']')) = [1,2]");
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
        expect(proto.getOperator().getName()).to.equal('==');

        params = proto.getOperator().getParamList();
        expect(params).to.have.lengthOf(2);
        expect(params[0].getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        functionCall = params[0].getFunctionCall();
        expect(functionCall.getName().getName()).to.equal('jcast');

        args = functionCall.getParamList();
        expect(args).to.have.lengthOf(1);
        expect(args[0].getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        functionCall = args[0].getFunctionCall();
        expect(functionCall.getName().getName()).to.equal('concat');

        args = functionCall.getParamList();
        expect(args).to.have.lengthOf(5);
        args.forEach(arg => expect(arg.getType()).to.equal(ExprStub.Expr.Type.LITERAL));
        expect(args[0].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(args[0].getLiteral().getVString().getValue()).toString()).to.equal('[');
        expect(args[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(args[1].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(args[2].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(args[2].getLiteral().getVString().getValue()).toString()).to.equal(',');
        expect(args[3].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        expect(args[3].getLiteral().getVUnsignedInt()).to.equal(2);
        expect(args[4].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
        expect(Buffer.from(args[4].getLiteral().getVString().getValue()).toString()).to.equal(']');

        const options = { mode: mysqlx.Mode.TABLE };

        proto = mysqlx.expr("foo->>'$.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.FUNC_CALL);

        fn = proto.getFunctionCall();
        functionName = fn.getName();
        expect(functionName.getName()).to.equal('json_unquote');

        params = fn.getParamList();
        expect(params).to.have.lengthOf(1);
        fstParam = params[0].getIdentifier();
        expect(fstParam.getName()).to.equal('foo');

        const documentPath = fstParam.getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        return expect(documentPath[0].getValue()).to.equal('bar');
    });
});
