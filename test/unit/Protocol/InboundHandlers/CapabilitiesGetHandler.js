'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let CapabilitiesGetHandler = require('../../../../lib/Protocol/InboundHandlers/CapabilitiesGetHandler');

describe('CapabilitiesGetHandler inbound handler', () => {
    let capabilities, info, logger;

    beforeEach('create fakes', () => {
        info = td.function();

        capabilities = td.replace('../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');
        logger = td.replace('../../../../lib/tool/log');

        td.when(logger('protocol:inbound:Mysqlx.Connection')).thenReturn({ info });

        CapabilitiesGetHandler = require('../../../../lib/Protocol/InboundHandlers/CapabilitiesGetHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Connection.Capabilities message is received', () => {
        it('finishes the associated job in the queue', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = () => {};

            const queueDone = td.function();
            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize(), { ignoreExtraArgs: true }).thenReturn(caps);

            handler[capabilities.MESSAGE_ID]('foo', queueDone);

            expect(td.explain(queueDone).callCount).to.equal(1);
            return expect(td.explain(queueDone).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('invokes the finishing handler', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = td.function();

            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize(), { ignoreExtraArgs: true }).thenReturn(caps);
            td.when(caps.toObject()).thenReturn('bar');

            handler[capabilities.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            expect(td.explain(handler._resolve).calls[0].args[0]).to.equal('bar');
        });

        it('logs the protocol message', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = td.function();

            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize('foo')).thenReturn(caps);

            handler[capabilities.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Capabilities');
            expect(td.explain(info).calls[0].args[1]).to.equal(caps);
        });
    });
});
