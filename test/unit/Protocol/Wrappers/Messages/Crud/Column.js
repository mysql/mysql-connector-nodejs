'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let column = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');

describe('Mysqlx.Crud.Column wrapper', () => {
    let CrudStub, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        column = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Column wrap instance with a given name', () => {
                const proto = new CrudStub.Column();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(column.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal('foo');
            });

            it('returns an empty wrap if no argument is provided', () => {
                td.when(wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(column.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.Column.prototype.setName).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Column message', () => {
                const proto = new CrudStub.Column();

                td.when(proto.getName()).thenReturn('foo');

                expect(column(proto).toJSON()).to.deep.equal({ name: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Column();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(column(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
