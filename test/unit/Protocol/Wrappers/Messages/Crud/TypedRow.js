'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let typedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');

describe('Mysqlx.Crud.Insert.TypedRow wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        typedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Insert.TypedRow wrap instance for a single value', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(expr.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(typedRow.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal(['baz']);
            });

            it('returns a Mysqlx.Crud.Insert.TypedRow wrap instance for a list of values', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(expr.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(typedRow.create(['foo']).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal(['baz']);
            });

            it('returns a Mysqlx.Crud.Insert.TypedRow without any undefined value', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(typedRow.create(undefined).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal([]);

                // call count has increased
                expect(typedRow.create([undefined]).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(2);
                expect(td.explain(proto.setFieldList).calls[1].args[0]).to.deep.equal([]);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Insert.TypedRow message', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(proto.getFieldList()).thenReturn(['foo']);
                td.when(expr('foo')).thenReturn({ toJSON: () => 'bar' });

                expect(typedRow(proto).toJSON()).to.deep.equal({ field: ['bar'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(typedRow(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
