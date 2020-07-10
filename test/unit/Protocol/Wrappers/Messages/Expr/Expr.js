'use strict';

/* eslint-env node, mocha */

const ExprStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
const ScalarStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let expr = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');

describe('Mysqlx.Expr.Expr wrapper', () => {
    let columnIdentifier, optionalString, parser, scalar, wraps;

    beforeEach('create fakes', () => {
        columnIdentifier = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
        optionalString = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/OptionalString');
        parser = td.replace('../../../../../../lib/ExprParser');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        expr = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('parses a raw X DevAPI expression string without placeholder assigments', () => {
                const exprData = { output: 'bar', placeholders: ['baz'] };
                const placeholderAssignments = { baz: 'qux' };
                const wrapsValueOf = td.function();
                const scalarValueOf = td.function();

                td.when(wraps('bar')).thenReturn({ valueOf: wrapsValueOf });
                td.when(wrapsValueOf()).thenReturn('quux');
                td.when(parser.parse('foo'), { ignoreExtraArgs: true }).thenReturn(exprData);
                td.when(scalar.create('qux')).thenReturn({ valueOf: scalarValueOf });
                td.when(scalarValueOf()).thenReturn('qux');

                const e = expr.create('foo', { toParse: true, toPrepare: true });

                expect(e.valueOf()).to.equal('quux');
                return expect(e.getPlaceholderArgs(placeholderAssignments)).to.be.an('array').and.be.empty;
            });

            it('parses a raw X DevAPI expression string with placeholder assignments', () => {
                const exprData = { output: 'bar', placeholders: ['baz'] };
                const placeholderAssignments = { baz: 'qux' };
                const wrapsValueOf = td.function();
                const scalarValueOf = td.function();

                td.when(wraps('bar')).thenReturn({ valueOf: wrapsValueOf });
                td.when(wrapsValueOf()).thenReturn('quux');
                td.when(parser.parse('foo'), { ignoreExtraArgs: true }).thenReturn(exprData);
                td.when(scalar.create('qux')).thenReturn({ valueOf: scalarValueOf });
                td.when(scalarValueOf()).thenReturn('qux');

                const e = expr.create('foo', { toParse: true });

                expect(e.valueOf()).to.equal('quux');
                expect(e.getPlaceholderArgs(placeholderAssignments)).to.deep.equal(['qux']);
            });

            it('returns an empty Mysqlx.Expr.Expr wrap instance if a value is not provided', () => {
                const valueOf = td.function();

                td.when(wraps(undefined)).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn('foo');

                expect(expr.create().valueOf()).to.equal('foo');
            });

            it('returns a Mysqlx.Expr.Expr wrap instance for a given value', () => {
                const proto = new ExprStub.Expr();
                const valueOf = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn('foo');

                expect(expr.create(proto).valueOf()).to.equal('foo');
            });

            it('returns a placeholder Mysqlx.Expr.Expr wrapper for a JavaScript number that represent an assignment position', () => {
                const position = 3;
                const valueOf = td.function();
                const proto = new ExprStub.Expr([ExprStub.Expr.Type.PLACEHOLDER]);
                proto.setPosition(position);

                td.when(wraps(proto)).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn('foo');

                expect(expr.create(position, { isPlaceholder: true }).valueOf()).to.equal('foo');
            });

            it('returns a literal Mysqlx.Expr.Expr wrapper for a JavaScript number', () => {
                const scalarValueOf = td.function();
                const wrapsValueOf = td.function();

                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_UINT);
                literal.setVUnsignedInt(3);

                const proto = new ExprStub.Expr([ExprStub.Expr.Type.LITERAL]);
                proto.setLiteral(literal);

                td.when(scalar.canEncode(3)).thenReturn(true);
                td.when(scalar.create(3)).thenReturn({ valueOf: scalarValueOf });
                td.when(scalarValueOf()).thenReturn(literal);
                td.when(wraps(proto)).thenReturn({ valueOf: wrapsValueOf });
                td.when(wrapsValueOf()).thenReturn('foo');

                expect(expr.create(3).valueOf()).to.equal('foo');
            });

            it('returns an array Mysqlx.Expr.Expr wrapper for a JavaScript array', () => {
                const scalarValueOf = td.function();
                const wrapsValueOf = td.function();
                const exprValueOf = td.function();
                const arrayValueOf = td.function();

                const str = new ScalarStub.String();
                str.setValue('foo');

                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_STRING);
                literal.setVString(str);

                const value = new ExprStub.Expr();
                value.setType(ExprStub.Expr.Type.LITERAL);
                value.setLiteral(literal);

                const arr = new ExprStub.Array();
                arr.addValue(value);

                const proto = new ExprStub.Expr([ExprStub.Expr.Type.ARRAY]);
                proto.setArray(arr);

                td.when(scalar.canEncode('foo')).thenReturn(true);
                td.when(scalar.create('foo')).thenReturn({ valueOf: scalarValueOf });
                td.when(scalarValueOf()).thenReturn(literal);
                td.when(wraps(proto)).thenReturn({ valueOf: wrapsValueOf });
                td.when(wrapsValueOf()).thenReturn('bar');
                td.when(wraps(value)).thenReturn({ valueOf: exprValueOf });
                td.when(exprValueOf()).thenReturn(value);
                td.when(wraps(arr)).thenReturn({ valueOf: arrayValueOf });
                td.when(arrayValueOf()).thenReturn(arr);

                expect(expr.create(['foo']).valueOf()).to.equal('bar');
            });

            it('returns an object Mysqlx.Expr.Expr wrapper for a plain JavaScript object', () => {
                const scalarValueOf = td.function();
                const exprValueOf = td.function();
                const fieldValueOf = td.function();
                const objectValueOf = td.function();
                const wrapsValueOf = td.function();

                const str = new ScalarStub.String();
                str.setValue('bar');

                const literal = new ScalarStub();
                literal.setType(ScalarStub.Type.V_STRING);
                literal.setVString(str);

                const value = new ExprStub.Expr();
                value.setType(ExprStub.Expr.Type.LITERAL);
                value.setLiteral(literal);

                const field = new ExprStub.Object.ObjectField();
                field.setKey('foo');
                field.setValue(value);

                const obj = new ExprStub.Object();
                obj.addFld(field);

                const proto = new ExprStub.Expr([ExprStub.Expr.Type.OBJECT]);
                proto.setObject(obj);

                td.when(scalar.canEncode('bar')).thenReturn(true);
                td.when(scalar.create('bar')).thenReturn({ valueOf: scalarValueOf });
                td.when(scalarValueOf()).thenReturn(literal);
                td.when(wraps(value)).thenReturn({ valueOf: exprValueOf });
                td.when(exprValueOf()).thenReturn(value);
                td.when(wraps(field)).thenReturn({ valueOf: fieldValueOf });
                td.when(fieldValueOf()).thenReturn(field);
                td.when(wraps(obj)).thenReturn({ valueOf: objectValueOf });
                td.when(objectValueOf()).thenReturn(obj);
                td.when(wraps(proto)).thenReturn({ valueOf: wrapsValueOf });
                td.when(wrapsValueOf()).thenReturn('baz');

                expect(expr.create({ foo: 'bar' }).valueOf()).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('getPlaceholderArgs()', () => {
            it('returns the the ordered list of arguments to assign to the existing placeholders', () => {
                const proto = new ExprStub.Expr();
                const wrapper = expr(proto);
                const valueOf = td.function();
                const bindings = { foo: 'bar', baz: 'qux' };

                // eslint-disable-next-line no-unused-expressions
                expect(wrapper.getPlaceholderArgs(bindings)).to.be.an('array').and.be.empty;

                wrapper.setPlaceholders(['foo', 'baz']);

                td.when(scalar.create('qux')).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn('qux');
                td.when(scalar.create('bar')).thenReturn({ valueOf });
                td.when(valueOf(), { times: 1 }).thenReturn('bar');

                expect(wrapper.getPlaceholderArgs(bindings)).to.deep.equal(['bar', 'qux']);
            });
        });

        context('getType()', () => {
            it('returns the expressions type name', () => {
                const proto = new ExprStub.Expr();

                proto.setType(ExprStub.Expr.Type.IDENT);
                expect(expr(proto).getType()).to.equal('IDENT');

                proto.setType(ExprStub.Expr.Type.LITERAL);
                expect(expr(proto).getType()).to.equal('LITERAL');

                proto.setType(ExprStub.Expr.Type.VARIABLE);
                expect(expr(proto).getType()).to.equal('VARIABLE');

                proto.setType(ExprStub.Expr.Type.FUNC_CALL);
                expect(expr(proto).getType()).to.equal('FUNC_CALL');

                proto.setType(ExprStub.Expr.Type.OPERATOR);
                expect(expr(proto).getType()).to.equal('OPERATOR');

                proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
                expect(expr(proto).getType()).to.equal('PLACEHOLDER');

                proto.setType(ExprStub.Expr.Type.OBJECT);
                expect(expr(proto).getType()).to.equal('OBJECT');

                proto.setType(ExprStub.Expr.Type.ARRAY);
                expect(expr(proto).getType()).to.equal('ARRAY');
            });
        });

        context('toJSON()', () => {
            it('returns undefined if the underlying protobuf object is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(expr().toJSON()).to.not.exist;
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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(columnIdentifier(identifier)).thenReturn({ toJSON });
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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(scalar(literal)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', literal: 'bar' });
            });

            it('returns a textual representation of a variable Mysqlx.Expr.Expr message', () => {
                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.VARIABLE);
                proto.setVariable('bar');

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(optionalString('bar')).thenReturn({ toJSON });
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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const optionalStringToJSON = td.function();
                const scalarToJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(optionalString('baz')).thenReturn({ toJSON: optionalStringToJSON });
                td.when(optionalStringToJSON()).thenReturn('baz');
                td.when(scalar(literal)).thenReturn({ toJSON: scalarToJSON });
                td.when(scalarToJSON()).thenReturn('qux');

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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(optionalString('baz')).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', operator: { name: 'bar', param: [{ type: 'VARIABLE', variable: 'baz' }] } });
            });

            it('returns a textual representation of a placeholder Mysqlx.Expr.Expr message', () => {
                const proto = new ExprStub.Expr();
                proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
                proto.setPosition(3);

                const wrapper = expr(proto);
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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(scalar(literal)).thenReturn({ toJSON });
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

                const wrapper = expr(proto);
                const getType = td.replace(wrapper, 'getType');
                const toJSON = td.function();

                td.when(getType()).thenReturn('foo');
                td.when(scalar(literal)).thenReturn({ toJSON });
                td.when(toJSON()).thenReturn('bar');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', array: { value: [{ type: 'LITERAL', literal: 'bar' }] } });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.Expr();
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(wraps(proto)).thenReturn({ valueOf });

                expect(expr(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
