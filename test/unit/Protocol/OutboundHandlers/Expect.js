'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let expectHandler = require('../../../../lib/Protocol/OutboundHandlers/Expect');

describe('Mysqlx.Expect outbound handler', () => {
    let close, info, logger, open;

    beforeEach('create fakes', () => {
        close = td.replace('../../../../lib/Protocol/Wrappers/Messages/Expect/Close');
        logger = td.replace('../../../../lib/tool/log');
        open = td.replace('../../../../lib/Protocol/Wrappers/Messages/Expect/Open');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Expect')).thenReturn({ info });

        expectHandler = require('../../../../lib/Protocol/OutboundHandlers/Expect');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Expect.Close messages', () => {
        const message = { serialize: td.function() };

        td.when(close.create()).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(expectHandler.encodeClose()).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Close');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Expect.Open messages', () => {
        const message = { serialize: td.function() };

        td.when(open.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(expectHandler.encodeOpen('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Open');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
