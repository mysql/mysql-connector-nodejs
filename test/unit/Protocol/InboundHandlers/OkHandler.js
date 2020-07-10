'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let OkHandler = require('../../../../lib/Protocol/InboundHandlers/OkHandler');

describe('OkHandler inbound handler', () => {
    let info, logger, ok;

    beforeEach('create fakes', () => {
        info = td.function();

        ok = td.replace('../../../../lib/Protocol/Wrappers/Messages/Ok');
        logger = td.replace('../../../../lib/tool/log');

        td.when(logger('protocol:inbound:Mysqlx')).thenReturn({ info });

        OkHandler = require('../../../../lib/Protocol/InboundHandlers/OkHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Ok message is received', () => {
        it('finishes the associated job in the queue', () => {
            const handler = new OkHandler();
            handler._resolve = () => {};

            const queueDone = td.function();

            td.when(ok.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[ok.MESSAGE_ID]('foo', queueDone);

            expect(td.explain(queueDone).callCount).to.equal(1);
            return expect(td.explain(queueDone).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('invokes the finishing handler', () => {
            const handler = new OkHandler();
            handler._resolve = td.function();

            td.when(ok.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[ok.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            return expect(td.explain(handler._resolve).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('logs the protocol message', () => {
            const handler = new OkHandler();
            handler._resolve = td.function();

            td.when(ok.deserialize('foo')).thenReturn('bar');

            handler[ok.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Ok');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });
});
