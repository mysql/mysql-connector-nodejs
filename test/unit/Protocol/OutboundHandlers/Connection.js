'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let connection = require('../../../../lib/Protocol/OutboundHandlers/Connection');

describe('Mysqlx.Connection outbound handler', () => {
    let capabilitiesGet, capabilitiesSet, close, logger, info;

    beforeEach('create fakes', () => {
        capabilitiesGet = td.replace('../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesGet');
        capabilitiesSet = td.replace('../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesSet');
        close = td.replace('../../../../lib/Protocol/Wrappers/Messages/Connection/Close');
        logger = td.replace('../../../../lib/tool/log');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Connection')).thenReturn({ info });

        connection = require('../../../../lib/Protocol/OutboundHandlers/Connection');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Connection.CapabilitiesGet messages', () => {
        const message = { serialize: td.function() };

        td.when(capabilitiesGet.create()).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(connection.encodeCapabilitiesGet()).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('CapabilitiesGet');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Connection.CapabilitiesSet messages', () => {
        const message = { serialize: td.function() };

        td.when(capabilitiesSet.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(connection.encodeCapabilitiesSet('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('CapabilitiesSet');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Connection.Close messages', () => {
        const message = { serialize: td.function() };

        td.when(close.create()).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(connection.encodeClose()).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Close');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
