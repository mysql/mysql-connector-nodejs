'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');

describe('Mysqlx.Crud.Find wrapper', () => {
    let CrudStub, collection, expr, limit, limitExpr, list, order, polyglot, projection, scalar, serializable, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
        limitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
        polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
        projection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Find wrap instance without placeholder assignments for a statement to be prepared', () => {
                const proto = new CrudStub.Find();
                const options = { mode: 'mode', toParse: true, toPrepare: true };
                const statement = { getCategory: td.function(), getTableName: td.function(), getSchema: td.function(), getProjections: td.function(), getCriteria: td.function(), getBindings: td.function(), getOrderings: td.function(), getCount: td.function(), getOffset: td.function(), getGroupings: td.function(), getGroupingCriteria: td.function(), getRowLock: td.function(), getLockContention: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getTableName()).thenReturn('s_bar');
                td.when(statement.getSchema()).thenReturn('s_baz');
                td.when(collection.create('s_bar', 's_baz')).thenReturn({ valueOf: () => 'bar.baz' });

                td.when(statement.getCategory()).thenReturn('mode');

                td.when(statement.getProjections()).thenReturn(['s_quux']);
                td.when(projection.create('s_quux', options)).thenReturn({ valueOf: () => 'quux' });

                td.when(statement.getCriteria()).thenReturn('s_quuz');
                td.when(statement.getBindings()).thenReturn({ v1: 'quuz', v2: 'corge' });
                td.when(getPlaceholderArgs({ v1: 'quuz', v2: 'corge' })).thenReturn(['quuz', 'corge']);

                td.when(expr.create('s_quuz', options)).thenReturn({ getPlaceholderArgs, valueOf: () => 'quuz' });

                td.when(statement.getCount()).thenReturn('s_garply');
                td.when(statement.getOffset()).thenReturn('s_waldo');
                td.when(limitExpr.create('s_garply', 's_waldo', Object.assign({}, options, { position: 2 }))).thenReturn({ valueOf: () => 'garply.waldo' });

                td.when(statement.getOrderings()).thenReturn(['s_fred']);
                td.when(order.create('s_fred', options)).thenReturn({ valueOf: () => 'fred' });

                td.when(statement.getGroupings()).thenReturn(['s_plugh']);
                td.when(expr.create('s_plugh', options)).thenReturn({ valueOf: () => 'plugh' });

                td.when(statement.getGroupingCriteria()).thenReturn('s_xyzzy');
                td.when(expr.create('s_xyzzy', options)).thenReturn({ valueOf: () => 'xyzzy' });

                td.when(statement.getRowLock()).thenReturn('thud');
                td.when(statement.getLockContention()).thenReturn('flob');

                expect(find.create(statement, { toPrepare: true }).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal('bar.baz');
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal('mode');
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(['quux']);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal('quuz');
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(1);
                expect(td.explain(proto.setLimitExpr).calls[0].args[0]).to.equal('garply.waldo');
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(['fred']);
                expect(td.explain(proto.setGroupingList).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingList).calls[0].args[0]).deep.to.equal(['plugh']);
                expect(td.explain(proto.setGroupingCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingCriteria).calls[0].args[0]).to.equal('xyzzy');
                expect(td.explain(proto.setLocking).callCount).to.equal(1);
                expect(td.explain(proto.setLocking).calls[0].args[0]).to.equal('thud');
                expect(td.explain(proto.setLockingOptions).callCount).to.equal(1);
                expect(td.explain(proto.setLockingOptions).calls[0].args[0]).to.equal('flob');
                expect(td.explain(proto.setArgsList).callCount).to.equal(0);
                expect(td.explain(proto.setLimit).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Find wrap instance with placeholder assignments for a statement to be executed', () => {
                const proto = new CrudStub.Find();
                const options = { mode: 'mode', toParse: true, toPrepare: false };
                const statement = { getCategory: td.function(), getTableName: td.function(), getSchema: td.function(), getProjections: td.function(), getCriteria: td.function(), getBindings: td.function(), getOrderings: td.function(), getCount: td.function(), getOffset: td.function(), getGroupings: td.function(), getGroupingCriteria: td.function(), getRowLock: td.function(), getLockContention: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getTableName()).thenReturn('s_bar');
                td.when(statement.getSchema()).thenReturn('s_baz');
                td.when(collection.create('s_bar', 's_baz')).thenReturn({ valueOf: () => 'bar.baz' });

                td.when(statement.getCategory()).thenReturn('mode');

                td.when(statement.getProjections()).thenReturn(['s_quux']);
                td.when(projection.create('s_quux', options)).thenReturn({ valueOf: () => 'quux' });

                td.when(statement.getCriteria()).thenReturn('s_quuz');
                td.when(statement.getBindings()).thenReturn({ v1: 'quuz', v2: 'corge' });
                td.when(getPlaceholderArgs({ v1: 'quuz', v2: 'corge' })).thenReturn(['quuz', 'corge']);

                td.when(expr.create('s_quuz', options)).thenReturn({ getPlaceholderArgs, valueOf: () => 'quuz' });

                td.when(statement.getCount()).thenReturn('s_garply');
                td.when(statement.getOffset()).thenReturn('s_waldo');
                td.when(limit.create('s_garply', 's_waldo')).thenReturn({ valueOf: () => 'garply.waldo' });

                td.when(statement.getOrderings()).thenReturn(['s_fred']);
                td.when(order.create('s_fred', options)).thenReturn({ valueOf: () => 'fred' });

                td.when(statement.getGroupings()).thenReturn(['s_plugh']);
                td.when(expr.create('s_plugh', options)).thenReturn({ valueOf: () => 'plugh' });

                td.when(statement.getGroupingCriteria()).thenReturn('s_xyzzy');
                td.when(expr.create('s_xyzzy', options)).thenReturn({ valueOf: () => 'xyzzy' });

                td.when(statement.getRowLock()).thenReturn('thud');
                td.when(statement.getLockContention()).thenReturn('flob');

                expect(find.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal('bar.baz');
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal('mode');
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(['quux']);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal('quuz');
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(['quuz', 'corge']);
                expect(td.explain(proto.setLimit).callCount).to.equal(1);
                expect(td.explain(proto.setLimit).calls[0].args[0]).to.equal('garply.waldo');
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(['fred']);
                expect(td.explain(proto.setGroupingList).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingList).calls[0].args[0]).deep.to.equal(['plugh']);
                expect(td.explain(proto.setGroupingCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingCriteria).calls[0].args[0]).to.equal('xyzzy');
                expect(td.explain(proto.setLocking).callCount).to.equal(1);
                expect(td.explain(proto.setLocking).calls[0].args[0]).to.equal('thud');
                expect(td.explain(proto.setLockingOptions).callCount).to.equal(1);
                expect(td.explain(proto.setLockingOptions).calls[0].args[0]).to.equal('flob');
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getLockOptions()', () => {
            it('returns the name of the extended lock option', () => {
                const proto = new CrudStub.Find();

                td.when(proto.getLockingOptions()).thenReturn(CrudStub.Find.RowLockOptions.NOWAIT);
                expect(find(proto).getLockOptions()).to.equal('NOWAIT');

                td.when(proto.getLockingOptions()).thenReturn(CrudStub.Find.RowLockOptions.SKIP_LOCKED);
                expect(find(proto).getLockOptions()).to.equal('SKIP_LOCKED');
            });
        });

        context('getLockType()', () => {
            it('returns the name of the lock type', () => {
                const proto = new CrudStub.Find();

                td.when(proto.getLocking()).thenReturn(CrudStub.Find.RowLock.SHARED_LOCK);
                expect(find(proto).getLockType()).to.equal('SHARED_LOCK');

                td.when(proto.getLocking()).thenReturn(CrudStub.Find.RowLock.EXCLUSIVE_LOCK);
                expect(find(proto).getLockType()).to.equal('EXCLUSIVE_LOCK');
            });
        });

        context('getDataModel()', () => {
            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Find();

                td.when(polyglot(proto)).thenReturn({ getDataModel: () => 'foo' });

                expect(find(proto).getDataModel()).to.equal('foo');
            });
        });

        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Find();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(find(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Find', () => {
                const proto = new CrudStub.Find();

                td.when(polyglot(proto)).thenReturn({ getDataModel: () => 'bar' });

                const wrap = find(proto);

                const getLockOptions = td.replace(wrap, 'getLockOptions');
                const getLockType = td.replace(wrap, 'getLockType');

                td.when(proto.getCollection()).thenReturn('foo');
                td.when(collection('foo')).thenReturn({ toJSON: () => 'foo' });

                td.when(proto.getProjectionList()).thenReturn(['baz']);
                td.when(projection('baz')).thenReturn('baz');
                td.when(list(['baz'])).thenReturn({ toJSON: () => ['baz'] });

                td.when(proto.getCriteria()).thenReturn('qux');
                td.when(expr('qux')).thenReturn({ toJSON: () => 'qux' });

                td.when(proto.getArgsList()).thenReturn(['quux']);
                td.when(scalar('quux')).thenReturn('quux');
                td.when(list(['quux'])).thenReturn({ toJSON: () => ['quux'] });

                td.when(proto.getOrderList()).thenReturn(['quuz']);
                td.when(order('quuz')).thenReturn('quuz');
                td.when(list(['quuz'])).thenReturn({ toJSON: () => ['quuz'] });

                td.when(proto.getGroupingList()).thenReturn(['corge']);
                td.when(expr('corge')).thenReturn('corge');
                td.when(list(['corge'])).thenReturn({ toJSON: () => ['corge'] });

                td.when(proto.getGroupingCriteria()).thenReturn('grault');
                td.when(expr('grault')).thenReturn({ toJSON: () => 'grault' });

                td.when(getLockType()).thenReturn('garply');
                td.when(getLockOptions()).thenReturn('waldo');

                td.when(proto.getLimit()).thenReturn('fred');
                td.when(limit('fred')).thenReturn({ toJSON: () => 'fred' });

                td.when(proto.getLimitExpr()).thenReturn('plugh');
                td.when(limitExpr('plugh')).thenReturn({ toJSON: () => 'plugh' });

                expect(wrap.toJSON()).to.deep.equal({ collection: 'foo', data_model: 'bar', projection: ['baz'], criteria: 'qux', args: ['quux'], order: ['quuz'], grouping: ['corge'], grouping_criteria: 'grault', locking: 'garply', locking_options: 'waldo', limit: 'fred', limit_expr: 'plugh' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Find();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(find(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
