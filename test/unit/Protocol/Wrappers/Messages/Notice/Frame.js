/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let frame = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Frame');

describe('Mysqlx.Notice.Frame wrapper', () => {
    let NoticeStub, bytes, empty, sessionStateChanged, sessionVariableChanged, warning, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
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
                td.when(bytes.deserialize('foo')).thenReturn('baz');
                td.when(NoticeStub.Frame.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(frame.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getPayload()', () => {
            it('returns a proper wrap instance for WARNING notices', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.WARNING);
                td.when(proto.getPayload()).thenReturn('foo');
                td.when(bytes('foo')).thenReturn({ toBuffer: () => 'bar' });
                td.when(warning.deserialize('bar')).thenReturn('baz');

                expect(frame(proto).getPayload()).to.equal('baz');
            });

            it('returns a proper wrap instance for SESSION_VARIABLE_CHANGED notices', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED);
                td.when(proto.getPayload()).thenReturn('foo');
                td.when(bytes('foo')).thenReturn({ toBuffer: () => 'bar' });
                td.when(sessionVariableChanged.deserialize('bar')).thenReturn('baz');

                expect(frame(proto).getPayload()).to.equal('baz');
            });

            it('returns a proper wrap instance for SESSION_STATE_CHANGED notices', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_STATE_CHANGED);
                td.when(proto.getPayload()).thenReturn('foo');
                td.when(bytes('foo')).thenReturn({ toBuffer: () => 'bar' });
                td.when(sessionStateChanged.deserialize('bar')).thenReturn('baz');

                expect(frame(proto).getPayload()).to.equal('baz');
            });

            it('returns a proper wrap instance for SERVER_HELLO notices', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SERVER_HELLO);
                td.when(empty()).thenReturn('foo');

                expect(frame(proto).getPayload()).to.equal('foo');
            });
        });

        context('getScope()', () => {
            it('returns the name of the notice scope', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn(NoticeStub.Frame.Scope.GLOBAL);
                expect(frame(proto).getScope()).to.equal('GLOBAL');

                td.when(proto.getScope()).thenReturn(NoticeStub.Frame.Scope.LOCAL);
                expect(frame(proto).getScope()).to.equal('LOCAL');
            });
        });

        context('getScopeId()', () => {
            it('returns the protocol identifier of the scope', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn(NoticeStub.Frame.Scope.GLOBAL);
                expect(frame(proto).getScopeId()).to.equal(NoticeStub.Frame.Scope.GLOBAL);
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

        context('getTypeId()', () => {
            it('returns the protocol identifier of the type', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SERVER_HELLO);
                expect(frame(proto).getTypeId()).to.equal(NoticeStub.Frame.Type.SERVER_HELLO);
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Notice.Frame message', () => {
                const proto = new NoticeStub.Frame();
                const wrap = frame(proto);
                const getType = td.replace(wrap, 'getType');
                const getScope = td.replace(wrap, 'getScope');
                const getPayload = td.replace(wrap, 'getPayload');

                td.when(getType()).thenReturn('foo');
                td.when(getScope()).thenReturn('bar');
                td.when(getPayload()).thenReturn({ toJSON: () => 'baz' });

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo', scope: 'bar', payload: 'baz' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of a Warning notice', () => {
                const proto = new NoticeStub.Frame();
                const wrap = frame(proto);
                const getPayload = td.replace(wrap, 'getPayload');

                td.when(proto.getScope()).thenReturn('foo');
                td.when(getPayload()).thenReturn({ toObject: () => 'bar' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.WARNING);

                expect(wrap.toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.WARNING, scope: 'foo', warning: 'bar' });
            });

            it('returns a plain JavaScript object representation of a SessionVariableChanged notice', () => {
                const proto = new NoticeStub.Frame();
                const wrap = frame(proto);
                const getPayload = td.replace(wrap, 'getPayload');

                td.when(proto.getScope()).thenReturn('foo');
                td.when(getPayload()).thenReturn({ toObject: () => 'bar' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED);

                expect(wrap.toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.SESSION_VARIABLE_CHANGED, scope: 'foo', variable: 'bar' });
            });

            it('returns a plain JavaScript object representation of a SessionStateChanged notice', () => {
                const proto = new NoticeStub.Frame();
                const wrap = frame(proto);
                const getPayload = td.replace(wrap, 'getPayload');

                td.when(proto.getScope()).thenReturn('foo');
                td.when(getPayload()).thenReturn({ toObject: () => 'bar' });
                td.when(proto.getType()).thenReturn(NoticeStub.Frame.Type.SESSION_STATE_CHANGED);

                expect(wrap.toObject()).to.deep.equal({ type: NoticeStub.Frame.Type.SESSION_STATE_CHANGED, scope: 'foo', state: 'bar' });
            });

            it('returns a plain JavaScript representation of an unknown notice', () => {
                const proto = new NoticeStub.Frame();

                td.when(proto.getScope()).thenReturn('foo');
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
