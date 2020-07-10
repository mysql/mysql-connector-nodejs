'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let authenticateContinue = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateContinue');

describe('Mysqlx.Session.AuthenticateContinue wrapper', () => {
    let SessionStub, bytes, serializable, tokenizable, wraps;

    beforeEach('create fakes', () => {
        SessionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_session_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        tokenizable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Tokenizable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        authenticateContinue = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateContinue');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Session.AuthenticateContinue wrapper instance based on a given token', () => {
                const proto = new SessionStub.AuthenticateContinue();

                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(authenticateContinue.create('foo').valueOf()).to.equal('baz');
                expect(td.explain(proto.setAuthData).callCount).to.equal(1);
                expect(td.explain(proto.setAuthData).calls[0].args[0]).to.equal('bar');
            });
        });

        context('deserialize()', () => {
            it('returns a Mysqlx.Session.AuthenticateContinue wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(SessionStub.AuthenticateContinue.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(authenticateContinue.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(authenticateContinue(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Session.AuthenticateContinue message', () => {
                const proto = new SessionStub.AuthenticateContinue();

                td.when(tokenizable(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(authenticateContinue(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new SessionStub.AuthenticateContinue();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(authenticateContinue(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
