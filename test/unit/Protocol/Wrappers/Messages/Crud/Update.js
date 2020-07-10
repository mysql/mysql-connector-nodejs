'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let update = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Update');

describe('Mysqlx.Crud.Update wrapper', () => {
    let CrudStub, collection, expr, limit, limitExpr, list, order, polyglot, scalar, serializable, updateOperation, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
        limitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
        polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        updateOperation = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        update = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Update');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Update wrap instance without placeholder assignments for a statement to be prepared', () => {
                const proto = new CrudStub.Update();
                const options = { mode: 'mode', toParse: true, toPrepare: true };
                const statement = { getCategory: td.function(), getTableName: td.function(), getSchema: td.function(), getCriteria: td.function(), getBindings: td.function(), getOrderings: td.function(), getCount: td.function(), getOperations: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getTableName()).thenReturn('s_bar');
                td.when(statement.getSchema()).thenReturn('s_baz');
                td.when(collection.create('s_bar', 's_baz')).thenReturn({ valueOf: () => 'bar.baz' });

                td.when(statement.getCategory()).thenReturn('mode');

                td.when(statement.getCriteria()).thenReturn('s_quux');
                td.when(statement.getBindings()).thenReturn({ v1: 'quuz', v2: 'corge' });
                td.when(getPlaceholderArgs({ v1: 'quuz', v2: 'corge' })).thenReturn(['quuz', 'corge']);

                td.when(expr.create('s_quux', options)).thenReturn({ getPlaceholderArgs, valueOf: () => 'quux' });

                td.when(statement.getCount()).thenReturn('s_garply');
                td.when(limitExpr.create('s_garply', Object.assign({}, options, { position: 2 }))).thenReturn({ valueOf: () => 'garply' });

                td.when(statement.getOrderings()).thenReturn(['s_waldo']);
                td.when(order.create('s_waldo', options)).thenReturn({ valueOf: () => 'waldo' });

                td.when(statement.getOperations()).thenReturn(['s_fred']);
                td.when(updateOperation.create('s_fred', options)).thenReturn({ valueOf: () => 'fred' });

                expect(update.create(statement, { toPrepare: true }).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal('bar.baz');
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal('mode');
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal('quux');
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(1);
                expect(td.explain(proto.setLimitExpr).calls[0].args[0]).to.equal('garply');
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(['waldo']);
                expect(td.explain(proto.setOperationList).callCount).to.equal(1);
                expect(td.explain(proto.setOperationList).calls[0].args[0]).deep.to.equal(['fred']);
                expect(td.explain(proto.setArgsList).callCount).to.equal(0);
                expect(td.explain(proto.setLimit).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Update wrap instance with placeholder assignments for a statement to be executed', () => {
                const proto = new CrudStub.Update();
                const options = { mode: 'mode', toParse: true, toPrepare: false };
                const statement = { getCategory: td.function(), getTableName: td.function(), getSchema: td.function(), getCriteria: td.function(), getBindings: td.function(), getOrderings: td.function(), getCount: td.function(), getOperations: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getTableName()).thenReturn('s_bar');
                td.when(statement.getSchema()).thenReturn('s_baz');
                td.when(collection.create('s_bar', 's_baz')).thenReturn({ valueOf: () => 'bar.baz' });

                td.when(statement.getCategory()).thenReturn('mode');

                td.when(statement.getCriteria()).thenReturn('s_quux');
                td.when(statement.getBindings()).thenReturn({ v1: 'quuz', v2: 'corge' });
                td.when(getPlaceholderArgs({ v1: 'quuz', v2: 'corge' })).thenReturn(['quuz', 'corge']);

                td.when(expr.create('s_quux', options)).thenReturn({ getPlaceholderArgs, valueOf: () => 'quux' });

                td.when(statement.getCount()).thenReturn('s_garply');
                td.when(limit.create('s_garply')).thenReturn({ valueOf: () => 'garply' });

                td.when(statement.getOrderings()).thenReturn(['s_waldo']);
                td.when(order.create('s_waldo', options)).thenReturn({ valueOf: () => 'waldo' });

                td.when(statement.getOperations()).thenReturn(['s_fred']);
                td.when(updateOperation.create('s_fred', options)).thenReturn({ valueOf: () => 'fred' });

                expect(update.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal('bar.baz');
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal('mode');
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal('quux');
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(['quuz', 'corge']);
                expect(td.explain(proto.setLimit).callCount).to.equal(1);
                expect(td.explain(proto.setLimit).calls[0].args[0]).to.equal('garply');
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(['waldo']);
                expect(td.explain(proto.setOperationList).callCount).to.equal(1);
                expect(td.explain(proto.setOperationList).calls[0].args[0]).deep.to.equal(['fred']);
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getDataModel()', () => {
            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Update();

                td.when(polyglot(proto)).thenReturn({ getDataModel: () => 'foo' });

                expect(update(proto).getDataModel()).to.equal('foo');
            });
        });

        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Update();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(update(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Update', () => {
                const proto = new CrudStub.Update();

                td.when(polyglot(proto)).thenReturn({ getDataModel: () => 'bar' });

                const wrap = update(proto);

                td.when(proto.getCollection()).thenReturn('foo');
                td.when(collection('foo')).thenReturn({ toJSON: () => 'foo' });

                td.when(proto.getCriteria()).thenReturn('p_baz');
                td.when(expr('p_baz')).thenReturn({ toJSON: () => 'baz' });

                td.when(proto.getArgsList()).thenReturn(['p_qux']);
                td.when(scalar('p_qux')).thenReturn('s_qux');
                td.when(list(['s_qux'])).thenReturn({ toJSON: () => ['qux'] });

                td.when(proto.getOrderList()).thenReturn(['p_quux']);
                td.when(order('p_quux')).thenReturn('o_quux');
                td.when(list(['o_quux'])).thenReturn({ toJSON: () => ['quux'] });

                td.when(proto.getOperationList()).thenReturn(['p_quuz']);
                td.when(updateOperation('p_quuz')).thenReturn('u_quuz');
                td.when(list(['u_quuz'])).thenReturn({ toJSON: () => ['quuz'] });

                td.when(proto.getLimit()).thenReturn('p_corge');
                td.when(limit('p_corge')).thenReturn({ toJSON: () => 'corge' });

                td.when(proto.getLimitExpr()).thenReturn('p_grault');
                td.when(limitExpr('p_grault')).thenReturn({ toJSON: () => 'grault' });

                expect(wrap.toJSON()).to.deep.equal({ collection: 'foo', data_model: 'bar', criteria: 'baz', args: ['qux'], order: ['quux'], operation: ['quuz'], limit: 'corge', limit_expr: 'grault' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Update();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(update(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
