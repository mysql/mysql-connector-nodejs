'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');

describe('Mysqlx.Crud.Collection wrapper', () => {
    let CrudStub, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Collection wrapper instance', () => {
                const proto = new CrudStub.Collection();
                const schema = { getName: td.function() };

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(schema.getName()).thenReturn('baz');

                expect(collection.create('foo', schema).valueOf()).to.equal('bar');
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setSchema).callCount).to.equal(1);
                expect(td.explain(proto.setSchema).calls[0].args[0]).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Collection message', () => {
                const proto = new CrudStub.Collection();

                td.when(proto.toObject()).thenReturn('foo');

                expect(collection(proto).toJSON()).to.deep.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Collection();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(collection(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
