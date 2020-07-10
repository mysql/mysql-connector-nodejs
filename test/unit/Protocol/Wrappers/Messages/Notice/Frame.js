'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let frame = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Frame');

describe('Mysqlx.Notice.Frame wrapper', () => {
    let NoticeStub, bytes, sessionStateChanged, sessionVariableChanged, warning, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        sessionStateChanged = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionStateChanged');
        sessionVariableChanged = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionVariableChanged');
        warning = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Warning');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        frame = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Frame');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Notice.Frame wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(NoticeStub.Frame.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(frame.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getScope()', () => {
            it('returns the name of the notice scope', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn(NoticeStub.Frame.Scope.GLOBAL);
                expect(frame(proto).getScope()).to.equal('GLOBAL');

                td.when(proto.getScope()).thenReturn(NoticeStub.Frame.Scope.LOCAL);
                expect(frame(proto).getScope()).to.equal('LOCAL');
            });
        });

        context('getType()', () => {
            it('returns the name of the notice type', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.WARNING);
                expect(frame(proto).getType()).to.equal('WARNING');

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED);
                expect(frame(proto).getType()).to.equal('SESSION_VARIABLE_CHANGED');

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_STATE_CHANGED);
                expect(frame(proto).getType()).to.equal('SESSION_STATE_CHANGED');

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.GROUP_REPLICATION_STATE_CHANGED);
                expect(frame(proto).getType()).to.equal('GROUP_REPLICATION_STATE_CHANGED');

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SERVER_HELLO);
                expect(frame(proto).getType()).to.equal('SERVER_HELLO');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Warning Mysqlx.Notice.Frame message', () => {
                const proto = new NoticeStub.Frame();

                const wrapper = frame(proto);
                const getScope = td.replace(wrapper, 'getScope');
                const getType = td.replace(wrapper, 'getType');

                td.when(getScope()).thenReturn('foo');
                td.when(getType()).thenReturn('bar');
                td.when(proto.getPayload()).thenReturn('baz');
                td.when(bytes('baz')).thenReturn({ toBuffer: () => 'qux' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.WARNING);
                td.when(warning.deserialize('qux')).thenReturn({ toJSON: () => 'quux' });

                expect(wrapper.toJSON()).to.deep.equal({ type: 'bar', scope: 'foo', payload: 'quux' });
            });

            it('returns a textual representation of a SessionVariableChanged Mysqlx.Notice.Frame message', () => {
                const proto = new NoticeStub.Frame();

                const wrapper = frame(proto);
                const getScope = td.replace(wrapper, 'getScope');
                const getType = td.replace(wrapper, 'getType');

                td.when(getScope()).thenReturn('foo');
                td.when(getType()).thenReturn('bar');
                td.when(proto.getPayload()).thenReturn('baz');
                td.when(bytes('baz')).thenReturn({ toBuffer: () => 'qux' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED);
                td.when(sessionVariableChanged.deserialize('qux')).thenReturn({ toJSON: () => 'quux' });

                expect(wrapper.toJSON()).to.deep.equal({ type: 'bar', scope: 'foo', payload: 'quux' });
            });

            it('returns a textual representation of a SessionStateChanged Mysqlx.Notice.Frame message', () => {
                const proto = new NoticeStub.Frame();

                const wrapper = frame(proto);
                const getScope = td.replace(wrapper, 'getScope');
                const getType = td.replace(wrapper, 'getType');

                td.when(getScope()).thenReturn('foo');
                td.when(getType()).thenReturn('bar');
                td.when(proto.getPayload()).thenReturn('baz');
                td.when(bytes('baz')).thenReturn({ toBuffer: () => 'qux' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_STATE_CHANGED);
                td.when(sessionStateChanged.deserialize('qux')).thenReturn({ toJSON: () => 'quux' });

                expect(wrapper.toJSON()).to.deep.equal({ type: 'bar', scope: 'foo', payload: 'quux' });
            });

            it('returns a textual representation of an unknown Mysqlx.Notice.Frame message', () => {
                const proto = new NoticeStub.Frame();

                const wrapper = frame(proto);
                const getScope = td.replace(wrapper, 'getScope');
                const getType = td.replace(wrapper, 'getType');

                td.when(getScope()).thenReturn('foo');
                td.when(getType()).thenReturn('bar');
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.UNKNOWN);
                td.when(proto.getPayload()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ type: 'bar', scope: 'foo' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of a Warning notice', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn('foo');
                td.when(proto.getPayload()).thenReturn('bar');
                td.when(bytes('bar')).thenReturn({ toBuffer: () => 'baz' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.WARNING);
                td.when(warning.deserialize('baz')).thenReturn({ toObject: () => 'qux' });

                expect(frame(proto).toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.WARNING, scope: 'foo', warning: 'qux' });
            });

            it('returns a plain JavaScript object representation of a SessionVariableChanged notice', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn('foo');
                td.when(proto.getPayload()).thenReturn('bar');
                td.when(bytes('bar')).thenReturn({ toBuffer: () => 'baz' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED);
                td.when(sessionVariableChanged.deserialize('baz')).thenReturn({ toObject: () => 'qux' });

                expect(frame(proto).toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED, scope: 'foo', variable: 'qux' });
            });

            it('returns a plain JavaScript object representation of a SessionStateChanged notice', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn('foo');
                td.when(proto.getPayload()).thenReturn('baz');
                td.when(bytes('baz')).thenReturn({ toBuffer: () => 'qux' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_STATE_CHANGED);
                td.when(sessionStateChanged.deserialize('qux')).thenReturn({ toObject: () => 'quux' });

                expect(frame(proto).toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.SESSION_STATE_CHANGED, scope: 'foo', state: 'quux' });
            });

            it('returns a plain JavaScript representation of an unknown notice', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn('foo');
                td.when(proto.getPayload()).thenReturn('baz');
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.UNKNOWN);

                expect(frame(proto).toObject()).to.deep.equal({ type: undefined, scope: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new NoticeStub.Frame();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(frame(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
