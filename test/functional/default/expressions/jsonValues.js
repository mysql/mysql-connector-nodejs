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

describe('X DevAPI expression encoder for JSON values', () => {
    context('representing objects', () => {
        it('returns a valid protobuf message for an empty JSON document', () => {
            const proto = mysqlx.expr('{}');

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OBJECT);
            expect(proto.getObject().getFldList()).to.have.lengthOf(0);
        });

        it('returns a valid protobuf message for a JSON document containing primitive values', () => {
            const doc = {
                foo: 'bar',
                baz: 1,
                qux: true,
                quux: null
            };

            const proto = mysqlx.expr(JSON.stringify(doc));
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            const fields = proto.getObject().getFldList();
            const expectedKeys = Object.keys(doc);

            expect(fields).to.have.lengthOf(expectedKeys.length);

            fields.forEach((f, i) => {
                expect(f.getKey()).to.equal(expectedKeys[i]);
                expect(f.getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            });

            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(fields[0].getValue().getLiteral().getVString().getValue()).toString()).to.equal(doc[expectedKeys[0]]);
            expect(fields[1].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            expect(fields[1].getValue().getLiteral().getVUnsignedInt()).to.equal(doc[expectedKeys[1]]);
            expect(fields[2].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            expect(fields[2].getValue().getLiteral().getVBool()).to.equal(doc[expectedKeys[2]]);
            return expect(fields[3].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_NULL);
        });

        it('returns a valid protobuf message for a nested JSON object containing nested objects', () => {
            const doc = {
                foo: {
                    bar: 'baz'
                }
            };

            const proto = mysqlx.expr(JSON.stringify(doc));
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            let fields = proto.getObject().getFldList();
            let expectedKeys = Object.keys(doc);
            expect(fields).to.have.lengthOf(expectedKeys.length);

            expect(fields[0].getKey()).to.equal('foo');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            fields = fields[0].getValue().getObject().getFldList();
            expectedKeys = Object.keys(doc.foo);
            expect(fields).to.have.lengthOf(expectedKeys.length);
            expect(fields[0].getKey()).to.equal('bar');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            return expect(Buffer.from(fields[0].getValue().getLiteral().getVString().getValue()).toString()).to.equal(doc.foo.bar);
        });

        it('returns a valid protobuf message for a nested JSON object containing different types of values', () => {
            const proto = mysqlx.expr('{"foo" : "bar", "baz": [1,2,[3],{}, TRUE, true, false, False, null, NULL, Null]}');
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            const fields = proto.getObject().getFldList();
            expect(fields).to.have.lengthOf(2);
            expect(fields[0].getKey()).to.equal('foo');
            expect(fields[1].getKey()).to.equal('baz');

            const fstValue = fields[0].getValue();
            expect(fstValue.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fstValue.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
            expect(Buffer.from(fstValue.getLiteral().getVString().getValue()).toString()).to.equal('bar');

            const sndValue = fields[1].getValue();
            expect(sndValue.getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            const valueArray = sndValue.getArray().getValueList();
            expect(valueArray).to.have.lengthOf(11);

            valueArray.slice(0, 2).forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(valueArray[2].getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            expect(valueArray[3].getType()).to.equal(ExprStub.Expr.Type.OBJECT);

            valueArray.slice(4, 8).forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            });

            valueArray.slice(8, valueArray.length).forEach(value => {
                expect(value.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(value.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_NULL);
            });
        });
    });

    context('representing arrays', () => {
        it('returns a valid protobuf message for an empty JSON array', () => {
            const proto = mysqlx.expr('[]');

            expect(proto.getType()).to.equal(ExprStub.Expr.Type.ARRAY);
            expect(proto.getArray().getValueList()).to.have.lengthOf(0);
        });

        it('returns a valid protobuf message for JSON array containing primitive values', () => {
            const jsonArray = ['foo', 'bar'];
            const proto = mysqlx.expr(JSON.stringify(jsonArray));
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            const values = proto.getArray().getValueList();
            expect(values).to.have.lengthOf(jsonArray.length);
            values.forEach((v, i) => {
                expect(v.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(v.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_STRING);
                expect(Buffer.from(v.getLiteral().getVString().getValue()).toString()).to.equal(jsonArray[i]);
            });
        });

        it('returns a valid protobuf message for JSON array containing JSON objects', () => {
            const jsonArray = [{ foo: true }, { bar: false }];
            const proto = mysqlx.expr(JSON.stringify(jsonArray));
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            const values = proto.getArray().getValueList();
            expect(values).to.have.lengthOf(jsonArray.length);
            values.forEach(v => expect(v.getType()).to.equal(ExprStub.Expr.Type.OBJECT));

            let fields = values[0].getObject().getFldList();
            expect(fields).to.have.lengthOf(Object.keys(jsonArray[0]).length);
            expect(fields[0].getKey()).to.equal('foo');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            // eslint-disable-next-line no-unused-expressions
            expect(fields[0].getValue().getLiteral().getVBool()).to.be.true;

            fields = values[1].getObject().getFldList();
            expect(fields).to.have.lengthOf(Object.keys(jsonArray[1]).length);
            expect(fields[0].getKey()).to.equal('bar');
            expect(fields[0].getValue().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
            expect(fields[0].getValue().getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_BOOL);
            return expect(fields[0].getValue().getLiteral().getVBool()).to.be.false;
        });

        it('returns a valid protobuf message for JSON array containing other JSON arrays', () => {
            const jsonArray = [[1, 2], [3, 4]];
            const proto = mysqlx.expr(JSON.stringify(jsonArray));
            expect(proto.getType()).to.equal(ExprStub.Expr.Type.ARRAY);

            const values = proto.getArray().getValueList();
            expect(values).to.have.lengthOf(jsonArray.length);
            values.forEach(v => expect(v.getType()).to.equal(ExprStub.Expr.Type.ARRAY));

            let innerValues = values[0].getArray().getValueList();
            innerValues.forEach(v => {
                expect(v.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(v.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(innerValues[0].getLiteral().getVUnsignedInt()).to.equal(1);
            expect(innerValues[1].getLiteral().getVUnsignedInt()).to.equal(2);

            innerValues = values[1].getArray().getValueList();
            innerValues.forEach(v => {
                expect(v.getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(v.getLiteral().getType()).to.equal(ScalarStub.Scalar.Type.V_UINT);
            });

            expect(innerValues[0].getLiteral().getVUnsignedInt()).to.equal(3);
            return expect(innerValues[1].getLiteral().getVUnsignedInt()).to.equal(4);
        });
    });
});
