'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let session = require('../../../../lib/Protocol/OutboundHandlers/Session');

describe('Mysqlx.Session outbound handler', () => {
    let authenticateStart, authenticateContinue, close, info, logger, reset;

    beforeEach('create fakes', () => {
        authenticateStart = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateStart');
        authenticateContinue = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateContinue');
        close = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/Close');
        reset = td.replace('../../../../lib/Protocol/Wrappers/Messages/Session/Reset');
        logger = td.replace('../../../../lib/tool/log');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Session')).thenReturn({ info });

        session = require('../../../../lib/Protocol/OutboundHandlers/Session');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Session.AuthenticateStart messages', () => {
        const message = { serialize: td.function() };

        td.when(authenticateStart.create('foo', 'bar')).thenReturn(message);
        td.when(message.serialize()).thenReturn('baz');

        expect(session.encodeAuthenticateStart('foo', 'bar')).to.equal('baz');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('AuthenticateStart');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Session.AuthenticateContinue messages', () => {
        const message = { serialize: td.function() };

        td.when(authenticateContinue.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(session.encodeAuthenticateContinue('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('AuthenticateContinue');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Session.Close messages', () => {
        const message = { serialize: td.function() };

        td.when(close.create()).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(session.encodeClose()).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Close');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Session.Reset messages keeping the connection open by default', () => {
        const message = { serialize: td.function() };

        td.when(reset.create(true)).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(session.encodeReset()).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Reset');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Session.Reset messages closing the connection', () => {
        const message = { serialize: td.function() };

        td.when(reset.create(false)).thenReturn(message);
        td.when(message.serialize()).thenReturn('foo');

        expect(session.encodeReset({ keepOpen: false })).to.equal('foo');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Reset');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
