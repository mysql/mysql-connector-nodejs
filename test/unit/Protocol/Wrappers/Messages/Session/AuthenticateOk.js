'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let authenticateOk = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateOk');

describe('Mysqlx.Session.AuthenticateOk wrapper', () => {
    let SessionStub, bytes, tokenizable, wraps;

    beforeEach('create fakes', () => {
        SessionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_session_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        tokenizable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Tokenizable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        authenticateOk = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateOk');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Session.AuthenticateOk wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(SessionStub.AuthenticateOk.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(authenticateOk.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Session.AuthenticateOk message', () => {
                const proto = new SessionStub.AuthenticateOk();

                td.when(tokenizable(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(authenticateOk(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new SessionStub.AuthenticateOk();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(authenticateOk(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
