'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let capabilitiesSet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesSet');

describe('Mysqlx.Connection.CapabilitiesSet wrapper', () => {
    let ConnectionStub, capabilities, serializable, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        capabilities = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capabilitiesSet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesSet');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Connection.CapabilitiesSet wrapper instance', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(capabilities.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(capabilitiesSet.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setCapabilities).callCount).to.equal(1);
                expect(td.explain(proto.setCapabilities).calls[0].args[0]).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(capabilitiesSet(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.CapabilitiesSet message', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(proto.getCapabilities()).thenReturn('p_foo');
                td.when(capabilities('p_foo')).thenReturn({ toJSON: () => 'foo' });

                expect(capabilitiesSet(proto).toJSON()).to.deep.equal({ capabilities: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(capabilitiesSet(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
