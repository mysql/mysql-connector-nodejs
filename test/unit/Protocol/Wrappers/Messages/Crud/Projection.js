'use strict';

/* eslint-env node, mocha */

const ExprStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const parserType = require('../../../../../../lib/ExprParser').Type.PROJECTED_SEARCH_EXPR;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');

describe('Mysqlx.Crud.Projection wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Projection wrap instance given a raw string', () => {
                td.when(expr.create('foo', { type: parserType })).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps('bar')).thenReturn({ valueOf: () => 'baz' });

                expect(projection.create('foo').valueOf()).to.equal('baz');
                expect(td.explain(CrudStub.Projection.prototype.setSource).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Projection wrapper given an expression object', () => {
                const proto = new CrudStub.Projection();
                const input = new ExprStub();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(projection.create(input).valueOf()).to.equal('foo');
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(input);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Projection message', () => {
                const proto = new CrudStub.Projection();

                td.when(proto.getSource()).thenReturn('p_foo');
                td.when(expr('p_foo')).thenReturn({ toJSON: () => 'foo' });
                td.when(proto.getAlias()).thenReturn('bar');

                expect(projection(proto).toJSON()).to.deep.equal({ source: 'foo', alias: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Projection();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(projection(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
