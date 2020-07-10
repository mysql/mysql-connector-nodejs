'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let limitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');

describe('Mysqlx.Crud.LimitExpr wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        limitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns an empty wrap instance if the count is not defined', () => {
                td.when(wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(limitExpr.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.LimitExpr.prototype.setRowCount).callCount).to.equal(0);
                expect(td.explain(CrudStub.LimitExpr.prototype.setOffset).callCount).to.equal(0);
            });

            context('when the statement should be executed', () => {
                it('returns a Mysqlx.Crud.LimitExpr wrap instance with the count if the offset is not defined', () => {
                    const proto = new CrudStub.LimitExpr();

                    td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                    td.when(expr.create('foo', { isPlaceholder: false })).thenReturn({ valueOf: () => 'baz' });

                    expect(limitExpr.create('foo').valueOf()).to.equal('bar');
                    expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                    expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('baz');
                    expect(td.explain(proto.setOffset).callCount).to.equal(0);
                });

                it('returns a Mysqlx.Crud.LimitExpr wrap instance with both the count and offset', () => {
                    const proto = new CrudStub.LimitExpr();

                    td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });
                    td.when(expr.create('foo', { isPlaceholder: false })).thenReturn({ valueOf: () => 'qux' });
                    td.when(expr.create('bar', { isPlaceholder: false })).thenReturn({ valueOf: () => 'quux' });

                    expect(limitExpr.create('foo', 'bar').valueOf()).to.equal('baz');
                    expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                    expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('qux');
                    expect(td.explain(proto.setOffset).callCount).to.equal(1);
                    expect(td.explain(proto.setOffset).calls[0].args[0]).to.equal('quux');
                });
            });

            context('when the statement should be prepared', () => {
                it('returns a Mysqlx.Crud.LimitExpr wrap instance with the count placeholder position if the offset is not defined', () => {
                    const proto = new CrudStub.LimitExpr();

                    td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                    td.when(expr.create(3, { isPlaceholder: true, toPrepare: true })).thenReturn({ valueOf: () => 'baz' });

                    expect(limitExpr.create('foo', { position: 3, toPrepare: true }).valueOf()).to.equal('bar');
                    expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                    expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('baz');
                    expect(td.explain(proto.setOffset).callCount).to.equal(0);
                });

                it('returns a Mysqlx.Crud.LimitExpr wrap instance with both the count and offset placeholder positions', () => {
                    const proto = new CrudStub.LimitExpr();

                    td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });
                    td.when(expr.create(3, { isPlaceholder: true, toPrepare: true })).thenReturn({ valueOf: () => 'qux' });
                    td.when(expr.create(4, { isPlaceholder: true, toPrepare: true })).thenReturn({ valueOf: () => 'quux' });

                    expect(limitExpr.create('foo', 'bar', { position: 3, toPrepare: true }).valueOf()).to.equal('baz');
                    expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                    expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('qux');
                    expect(td.explain(proto.setOffset).callCount).to.equal(1);
                    expect(td.explain(proto.setOffset).calls[0].args[0]).to.equal('quux');
                });
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns nothing if the underlying protobuf instance is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(limitExpr().toJSON()).to.not.exist;
            });

            it('returns a textual representation of a Mysqlx.Crud.LimitExpr message', () => {
                const proto = new CrudStub.LimitExpr();

                td.when(proto.getRowCount()).thenReturn('p_foo');
                td.when(expr('p_foo')).thenReturn({ toJSON: () => 'foo' });

                td.when(proto.getOffset()).thenReturn('p_bar');
                td.when(expr('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(limitExpr(proto).toJSON()).to.deep.equal({ row_count: 'foo', offset: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.LimitExpr();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(limitExpr(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
