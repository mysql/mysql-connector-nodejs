'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let prepareHandler = require('../../../../lib/Protocol/OutboundHandlers/Prepare');

describe('Mysqlx.Prepare outbound handler', () => {
    let deallocate, execute, info, logger, prepare;

    beforeEach('create fakes', () => {
        deallocate = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Deallocate');
        execute = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
        prepare = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
        logger = td.replace('../../../../lib/tool/log');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Prepare')).thenReturn({ info });

        prepareHandler = require('../../../../lib/Protocol/OutboundHandlers/Prepare');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Prepare.Deallocate messages', () => {
        const message = { serialize: td.function() };

        td.when(deallocate.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodeDeallocate('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Deallocate');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Prepare.Execute messages', () => {
        const message = { serialize: td.function() };

        td.when(execute.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodeExecute('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Execute');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Prepare.Prepare messages', () => {
        const message = { serialize: td.function() };

        td.when(prepare.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodePrepare('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Prepare');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
