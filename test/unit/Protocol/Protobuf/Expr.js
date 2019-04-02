'use strict';

/* eslint-env node, mocha */

const Expr = require('../../../../lib/Protocol/Protobuf/Adapters/Expr');
const ExprStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').Expr;
const Scalar = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const Type = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').Expr.Type;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Expr', () => {
        let FakeExpr, parse;

        beforeEach('setup fakes', () => {
            parse = td.function();

            td.replace('../../../../lib/ExprParser', { parse });
            FakeExpr = require('../../../../lib/Protocol/Protobuf/Adapters/Expr');
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('createExpr()', () => {
            beforeEach('setup fakes', () => {
                td.when(parse(), { ignoreExtraArgs: true }).thenReturn({ output: {} });
            });

            it('returns the input value if it is an expression', () => {
                const literal = new Scalar();
                literal.setType(Scalar.Type.V_NULL);

                const expected = new ExprStub();
                expected.setType(Type.LITERAL);
                expected.setLiteral();

                const actual = FakeExpr.createExpr(expected);

                expect(td.explain(parse).callCount).to.equal(0);
                expect(actual.toObject()).to.deep.equal(expected.toObject());
            });

            it('enables expression parsing by default', () => {
                FakeExpr.createExpr('foo');

                expect(td.explain(parse).callCount).to.equal(1);
                expect(td.explain(parse).calls[0].args[0]).to.equal('foo');
            });

            it('stringifies non-string input for parsing', () => {
                FakeExpr.createExpr({ foo: 'bar' });

                expect(td.explain(parse).callCount).to.equal(1);
                expect(td.explain(parse).calls[0].args[0]).to.equal('{"foo":"bar"}');
            });

            it('disables expression parsing on demand', () => {
                FakeExpr.createExpr({ foo: 'bar' }, { parse: false });

                expect(td.explain(parse).callCount).to.equal(0);
            });

            it('encodes a JavaScript array', () => {
                const array1 = Expr.createExpr(['foo', 'bar']);
                const array2 = Expr.createExpr(['foo', 'bar'], { parse: false });

                expect(array1.getType()).to.equal(Type.ARRAY);
                expect(array2.getType()).to.equal(Type.ARRAY);
            });

            it('encodes a JavaScript plain object', () => {
                const obj1 = Expr.createExpr({ foo: 'bar' });
                const obj2 = Expr.createExpr({ foo: 'bar' }, { parse: false });

                expect(obj1.getType()).to.equal(Type.OBJECT);
                expect(obj2.getType()).to.equal(Type.OBJECT);
            });

            it('encodes a JavaScript primitive type', () => {
                const id = Expr.createExpr('foo');
                const literal = Expr.createExpr('foo', { parse: false });

                expect(id.getType()).to.equal(Type.IDENT);
                expect(literal.getType()).to.equal(Type.LITERAL);
            });

            it('encodes a JavaScript Date object', () => {
                const now = new Date();
                const obj = Expr.createExpr({ foo: now });

                expect(obj.getType()).to.equal(Type.OBJECT);

                const fields = obj.getObject().getFldList();
                expect(fields).to.have.length(1);
                expect(fields[0].getValue().getType()).to.equal(Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                // eslint-disable-next-line node/no-deprecated-api
                return expect(new Buffer(fields[0].getValue().getLiteral().getVString().getValue()).toString()).to.equal(now.toJSON());
            });
        });
    });
});
