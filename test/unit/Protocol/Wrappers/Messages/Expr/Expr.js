/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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

const ExprStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
const ScalarStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement test doubles
let Expr = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');

describe('Mysqlx.Expr.Expr wrapper', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        // TODO(Rui): although they will not increase code coverage, we should
        // write some more unit tests for the Expr.create() method.
        context('create()', () => {
            it('returns an empty expression for an unknown literal type', () => {
                const unknown = () => {};
                const expr = Expr.create({ isLiteral: true, value: unknown });

                expect(expr.valueOf).to.be.a('function');
                // eslint-disable-next-line no-unused-expressions
                expect(expr.valueOf()).to.not.exist;
            });

            it('ignores fields of unknown types in a plain JavaScript object', () => {
                const unknown = () => {};
                const expr = Expr.create({ isLiteral: true, value: { field: unknown } });

                expect(expr.valueOf).to.be.a('function');
                expect(expr.valueOf().getType).to.be.a('function');
                expect(expr.valueOf().getType()).to.equal(ExprStub.Expr.Type.OBJECT);
                // eslint-disable-next-line no-unused-expressions
                expect(expr.valueOf().getObject().getFldList()).to.be.an('array').and.be.empty;
            });

            it('returns an opaque strings for an interval unit', () => {
                const unit = 'foo';
                const expr = Expr.create({ isLiteral: false, value: { type: 'intervalUnit', value: unit } });

                expect(expr.valueOf).to.be.a('function');
                expect(expr.valueOf().getType).to.be.a('function');
                expect(expr.valueOf().getType()).to.equal(ExprStub.Expr.Type.LITERAL);
                expect(expr.valueOf().getLiteral().getType).to.be.a('function');
                expect(expr.valueOf().getLiteral().getType()).to.equal(ScalarStub.Type.V_OCTETS);
                expect(expr.valueOf().getLiteral().getVOctets().getValue).to.be.a('function');
                expect(expr.valueOf().getLiteral().getVOctets().getValue()).to.deep.equal(Buffer.from(unit));
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the Expressions type name', () => {
                const proto = new ExprStub.Expr();

                proto.setType(ExprStub.Expr.Type.IDENT);
                expect(Expr(proto).getType()).to.equal('IDENT');

                proto.setType(ExprStub.Expr.Type.LITERAL);
                expect(Expr(proto).getType()).to.equal('LITERAL');

                proto.setType(ExprStub.Expr.Type.VARIABLE);
                expect(Expr(proto).getType()).to.equal('VARIABLE');

                proto.setType(ExprStub.Expr.Type.FUNC_CALL);
                expect(Expr(proto).getType()).to.equal('FUNC_CALL');

                proto.setType(ExprStub.Expr.Type.OPERATOR);
                expect(Expr(proto).getType()).to.equal('OPERATOR');

                proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
                expect(Expr(proto).getType()).to.equal('PLACEHOLDER');

                proto.setType(ExprStub.Expr.Type.OBJECT);
                expect(Expr(proto).getType()).to.equal('OBJECT');

                proto.setType(ExprStub.Expr.Type.ARRAY);
                expect(Expr(proto).getType()).to.equal('ARRAY');
            });
        });

        context('toJSON()', () => {
            let ColumnIdentifier, OptionalString, Scalar;

            beforeEach('replace dependencies with test doubles', () => {
                ColumnIdentifier = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
                OptionalString = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/OptionalString');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                // reload module with the replacements
                Expr = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
            });

            it('returns undefined if the underlying protobuf object is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(Expr().toJSON()).to.not.exist;
            });

            it('returns a textual representation of an Identifier Mysqlx.Expr.Expr message', () => {
                const documentPathItem = new ExprStub.DocumentPathItem();
                documentPathItem.setType(ExprStub.DocumentPathItem.Type.MEMBER);
                documentPathItem.setValue('foo');

                const identifier = new ExprStub.ColumnIdentifier();
                identifier.addDocumentPath(documentPathItem);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.IDENT);
                proto.setIdentifier(identifier);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(ColumnIdentifier(identifier)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', identifier: 'bar' });
            });

            it('returns a textual representation of a Literal Mysqlx.Expr.Expr message', () => {
                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_UINT);
                literal.setVUnsignedInt(3);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.LITERAL);
                proto.setLiteral(literal);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(Scalar(literal)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', literal: 'bar' });
            });

            it('returns a textual representation of a variable Mysqlx.Expr.Expr message', () => {
                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.VARIABLE);
                proto.setVariable('bar');

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(OptionalString('bar')).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', variable: 'bar' });
            });

            it('returns a textual representation of a FunctionCall Mysqlx.Expr.Expr message', () => {
                const identifier = new ExprStub.Identifier();
                identifier.setName('bar');
                identifier.setSchemaName('baz');

                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_UINT);
                literal.setVUnsignedInt(3);

                const param = new ExprStub.Expr();
                param.setType(ExprStub.Expr.Type.LITERAL);
                param.setLiteral(literal);

                const functionCall = new ExprStub.FunctionCall();
                functionCall.setName(identifier);
                functionCall.addParam(param);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.FUNC_CALL);
                proto.setFunctionCall(functionCall);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const optStringToJSON = td.function();
                const ScalarToJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(OptionalString('baz')).thenReturn({ toJSON: optStringToJSON });
                td.when(optStringToJSON()).thenReturn('baz');
                td.when(Scalar(literal)).thenReturn({ toJSON: ScalarToJSON });
                td.when(ScalarToJSON()).thenReturn('qux');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', function_call: { name: { name: 'bar', schema_name: 'baz' }, param: [{ type: 'LITERAL', literal: 'qux' }] } });
            });

            it('returns a textual representation of a Operator Mysqlx.Expr.Expr message', () => {
                const param = new ExprStub.Expr();
                param.setType(ExprStub.Expr.Type.VARIABLE);
                param.setVariable('baz');

                const operator = new ExprStub.Operator();
                operator.setName('bar');
                operator.addParam(param);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.OPERATOR);
                proto.setOperator(operator);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(OptionalString('baz')).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', operator: { name: 'bar', param: [{ type: 'VARIABLE', variable: 'baz' }] } });
            });

            it('returns a textual representation of a placeholder Mysqlx.Expr.Expr message', () => {
                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
                proto.setPosition(3);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');

                td.when(getType()).thenReturn('foo');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', position: 3 });
            });

            it('returns a textual representation of an Object Mysqlx.Expr.Expr message', () => {
                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_UINT);
                literal.setVUnsignedInt(3);

                const value = new ExprStub.Expr();
                value.setType(ExprStub.Expr.Type.LITERAL);
                value.setLiteral(literal);

                const field = new ExprStub.Object.ObjectField();
                field.setKey('bar');
                field.setValue(value);

                const pObject = new ExprStub.Object();
                pObject.addFld(field);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.OBJECT);
                proto.setObject(pObject);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(Scalar(literal)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', object: { fld: [{ key: 'bar', value: { type: 'LITERAL', literal: 'baz' } }] } });
            });

            it('returns a textual representation of an Array Mysqlx.Expr.Expr message', () => {
                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_UINT);
                literal.setVUnsignedInt(3);

                const value = new ExprStub.Expr();
                value.setType(ExprStub.Expr.Type.LITERAL);
                value.setLiteral(literal);

                const pArray = new ExprStub.Array();
                pArray.addValue(value);

                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.ARRAY);
                proto.setArray(pArray);

                const wrapper = Expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(Scalar(literal)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', array: { value: [{ type: 'LITERAL', literal: 'bar' }] } });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Expr = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.Expr();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Expr(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
