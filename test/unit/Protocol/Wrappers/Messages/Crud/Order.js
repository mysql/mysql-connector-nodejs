'use strict';

/* eslint-env node, mocha */

const ExprStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const parserType = require('../../../../../../lib/ExprParser').Type.SORT_EXPR;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');

describe('Mysqlx.Crud.Order wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Order wrap instance given a raw string', () => {
                td.when(expr.create('foo', { type: parserType })).thenReturn('bar');
                td.when(wraps('bar')).thenReturn({ valueOf: () => 'baz' });

                expect(order.create('foo').valueOf()).to.equal('baz');
                expect(td.explain(CrudStub.Order.prototype.setExpr).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Order wrapper given an expression object', () => {
                const proto = new CrudStub.Order();
                const input = new ExprStub();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(order.create(input).valueOf()).to.equal('foo');
                expect(td.explain(proto.setExpr).callCount).to.equal(1);
                expect(td.explain(proto.setExpr).calls[0].args[0]).to.equal(input);
            });
        });
    });

    context('instance methods', () => {
        context('getDirection()', () => {
            it('returns the ordering direction identifier', () => {
                const proto = new CrudStub.Order();

                td.when(proto.getDirection()).thenReturn(CrudStub.Order.Direction.ASC);
                expect(order(proto).getDirection()).to.equal('ASC');

                td.when(proto.getDirection()).thenReturn(CrudStub.Order.Direction.DESC);
                expect(order(proto).getDirection()).to.equal('DESC');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Order message', () => {
                const proto = new CrudStub.Order();

                const wrap = order(proto);
                const getDirection = td.replace(wrap, 'getDirection');

                td.when(proto.getExpr()).thenReturn('p_foo');
                td.when(expr('p_foo')).thenReturn({ toJSON: () => 'foo' });
                td.when(getDirection()).thenReturn('bar');

                expect(wrap.toJSON()).to.deep.equal({ expr: 'foo', direction: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Order();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(order(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
