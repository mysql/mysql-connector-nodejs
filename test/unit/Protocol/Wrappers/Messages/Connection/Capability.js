'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let capability = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capability');

describe('Mysqlx.Connection.Capability wrapper', () => {
    let ConnectionStub, any, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capability = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capability');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub using the input object properties', () => {
                const proto = new ConnectionStub.Capability();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(any.create('b')).thenReturn({ valueOf: () => 'bar' });

                expect(capability.create('a', 'b').valueOf()).to.equal('foo');
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal('a');
                expect(td.explain(proto.setValue).callCount).to.equal(1);
                expect(td.explain(proto.setValue).calls[0].args[0]).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.Capability message', () => {
                const proto = new ConnectionStub.Capability();

                td.when(proto.getName()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('p_bar');
                td.when(any('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(capability(proto).toJSON()).to.deep.equal({ name: 'foo', value: 'bar' });
            });
        });

        context('toObject()', () => {
            it('returns an object containing the key-value pair mapping of given capability', () => {
                const proto = new ConnectionStub.Capability();

                td.when(proto.getName()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('p_bar');
                td.when(any('p_bar')).thenReturn({ toLiteral: () => 'bar' });

                expect(capability(proto).toObject()).to.deep.equal({ foo: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.Capability();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(capability(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
