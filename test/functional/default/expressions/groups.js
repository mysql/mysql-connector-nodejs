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

describe('X DevAPI expression encoder for groups', () => {
    it('returns a valid protobuf message for a grouped expression containing a literal', () => {
        const proto = mysqlx.expr('(TRUE)');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(proto.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        return expect(proto.getLiteral().getVBool()).to.be.true;
    });

    it('returns a valid protobuf message for a grouped expression containing operators', () => {
        let proto = mysqlx.expr('(1 in (1,2,3)) = TRUE');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);

        let equalityOperator = proto.getOperator();
        expect(equalityOperator.getName()).to.equal('==');
        expect(equalityOperator.getParamList()).to.have.lengthOf(2);

        let inOperator = equalityOperator.getParamList()[0];
        expect(inOperator.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
        expect(inOperator.getOperator().getName()).to.equal('in');

        let params = inOperator.getOperator().getParamList();
        expect(params).to.have.lengthOf(4);

        params.forEach(param => {
            expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        });

        expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
        expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

        expect(equalityOperator.getParamList()[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(equalityOperator.getParamList()[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        // eslint-disable-next-line no-unused-expressions
        expect(equalityOperator.getParamList()[1].getLiteral().getVBool()).to.be.true;

        proto = mysqlx.expr('(1 not in (1,2,3)) = FALSE');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);

        equalityOperator = proto.getOperator();
        expect(equalityOperator.getName()).to.equal('==');
        expect(equalityOperator.getParamList()).to.have.lengthOf(2);

        inOperator = equalityOperator.getParamList()[0];
        expect(inOperator.getType()).to.equal(ExprStub.Expr.Type.OPERATOR);
        expect(inOperator.getOperator().getName()).to.equal('not_in');

        params = inOperator.getOperator().getParamList();
        expect(params).to.have.lengthOf(4);

        params.forEach(param => {
            expect(param.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(param.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
        });

        expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
        expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
        expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

        expect(equalityOperator.getParamList()[1].getType()).to.equal(ExprStub.Expr.Type.LITERAL);
        expect(equalityOperator.getParamList()[1].getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
        return expect(equalityOperator.getParamList()[1].getLiteral().getVBool()).to.be.false;
    });
});
