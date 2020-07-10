'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');

describe('Mysqlx.Crud.Limit wrapper', () => {
    let CrudStub, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns an empty wrap instance when the count is not defined', () => {
                td.when(wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(limit.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.Limit.prototype.setRowCount).callCount).to.equal(0);
                expect(td.explain(CrudStub.Limit.prototype.setOffset).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Limit wrap instance with the count when the offset is not defined', () => {
                const proto = new CrudStub.Limit();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(limit.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setOffset).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Limit wrap instance with both the count and offset', () => {
                const proto = new CrudStub.Limit();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(limit.create('foo', 'bar').valueOf()).to.equal('baz');
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setOffset).callCount).to.equal(1);
                expect(td.explain(proto.setOffset).calls[0].args[0]).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns nothing if the underlying protobuf instance is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(limit().toJSON()).to.not.exist;
            });

            it('returns a textual representation of a Mysqlx.Crud.Limit message', () => {
                const proto = new CrudStub.Limit();

                td.when(proto.getRowCount()).thenReturn('foo');
                td.when(proto.getOffset()).thenReturn('bar');

                expect(limit(proto).toJSON()).to.deep.equal({ row_count: 'foo', offset: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Limit();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(limit(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
