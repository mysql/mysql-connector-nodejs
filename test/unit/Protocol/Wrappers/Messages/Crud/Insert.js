'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');

describe('Mysqlx.Crud.Insert wrapper', () => {
    let CrudStub, collection, column, list, polyglot, scalar, serializable, typedRow, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
        column = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        typedRow = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Insert wrap instance', () => {
                const proto = new CrudStub.Insert();
                const statement = { getCategory: td.function(), getTableName: td.function(), getSchema: td.function(), getColumns: td.function(), getItems: td.function(), isUpsert: td.function() };

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getTableName()).thenReturn('s_bar');
                td.when(statement.getSchema()).thenReturn('s_baz');
                td.when(collection.create('s_bar', 's_baz')).thenReturn({ valueOf: () => 'bar.baz' });

                td.when(statement.getCategory()).thenReturn('qux');

                td.when(statement.getColumns()).thenReturn(['s_quux', 's_quuz']);
                td.when(column.create('s_quux')).thenReturn({ valueOf: () => 'quux' });
                td.when(column.create('s_quuz')).thenReturn({ valueOf: () => 'quuz' });

                td.when(statement.getItems()).thenReturn(['s_corge', 's_grault']);
                td.when(typedRow.create('s_corge')).thenReturn({ valueOf: () => 'corge' });
                td.when(typedRow.create('s_grault')).thenReturn({ valueOf: () => 'grault' });

                td.when(statement.isUpsert()).thenReturn('garply');

                expect(insert.create(statement, { toPrepare: true }).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal('bar.baz');
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal('qux');
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(['quux', 'quuz']);
                expect(td.explain(proto.setRowList).callCount).to.equal(1);
                expect(td.explain(proto.setRowList).calls[0].args[0]).to.deep.equal(['corge', 'grault']);
                expect(td.explain(proto.setUpsert).callCount).to.equal(1);
                expect(td.explain(proto.setUpsert).calls[0].args[0]).to.equal('garply');
            });
        });
    });

    context('instance methods', () => {
        context('getDataModel()', () => {
            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Insert();
                const getDataModel = td.function();

                td.when(polyglot(proto)).thenReturn({ getDataModel });
                td.when(getDataModel()).thenReturn('foo');

                expect(insert(proto).getDataModel()).to.equal('foo');
            });
        });

        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Insert();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(insert(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Insert message', () => {
                const proto = new CrudStub.Insert();

                td.when(proto.getCollection()).thenReturn('p_foo');
                td.when(collection('p_foo')).thenReturn({ toJSON: () => 'foo' });

                td.when(polyglot(proto)).thenReturn({ getDataModel: () => 'bar' });

                td.when(proto.getProjectionList()).thenReturn(['p_baz', 'p_qux']);
                td.when(column('p_baz')).thenReturn('pp_baz');
                td.when(column('p_qux')).thenReturn('pp_qux');
                td.when(list(['pp_baz', 'pp_qux'])).thenReturn({ toJSON: () => ['baz', 'qux'] });

                td.when(proto.getRowList()).thenReturn(['p_quux', 'p_quuz']);
                td.when(typedRow('p_quux')).thenReturn('pp_quux');
                td.when(typedRow('p_quuz')).thenReturn('pp_quuz');
                td.when(list(['pp_quux', 'pp_quuz'])).thenReturn({ toJSON: () => ['quux', 'quuz'] });

                td.when(proto.getArgsList()).thenReturn(['p_corge', 'p_grault']);
                td.when(scalar('p_corge')).thenReturn('pp_corge');
                td.when(scalar('p_grault')).thenReturn('pp_grault');
                td.when(list(['pp_corge', 'pp_grault'])).thenReturn({ toJSON: () => ['corge', 'grault'] });

                td.when(proto.getUpsert()).thenReturn('garply');

                expect(insert(proto).toJSON()).to.deep.equal({ collection: 'foo', data_model: 'bar', projection: ['baz', 'qux'], row: ['quux', 'quuz'], args: ['corge', 'grault'], upsert: 'garply' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Insert();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(insert(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
