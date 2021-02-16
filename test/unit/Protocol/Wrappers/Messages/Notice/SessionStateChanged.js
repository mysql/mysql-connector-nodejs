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
let sessionStateChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionStateChanged');

describe('Mysqlx.Notice.SessionStateChanged wrapper', () => {
    let NoticeStub, bytes, scalar, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        sessionStateChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionStateChanged');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Notice.SessionStateChanged wrap instance based on raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn('baz');
                td.when(NoticeStub.SessionStateChanged.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(sessionStateChanged.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getParameter()', () => {
            it('returns the name of the state parameter that has changed', () => {
                const proto = new NoticeStub.SessionStateChanged();

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.CURRENT_SCHEMA);
                expect(sessionStateChanged(proto).getParameter()).to.equal('CURRENT_SCHEMA');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.ACCOUNT_EXPIRED);
                expect(sessionStateChanged(proto).getParameter()).to.equal('ACCOUNT_EXPIRED');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.GENERATED_INSERT_ID);
                expect(sessionStateChanged(proto).getParameter()).to.equal('GENERATED_INSERT_ID');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.ROWS_AFFECTED);
                expect(sessionStateChanged(proto).getParameter()).to.equal('ROWS_AFFECTED');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.ROWS_FOUND);
                expect(sessionStateChanged(proto).getParameter()).to.equal('ROWS_FOUND');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.ROWS_MATCHED);
                expect(sessionStateChanged(proto).getParameter()).to.equal('ROWS_MATCHED');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.TRX_COMMITTED);
                expect(sessionStateChanged(proto).getParameter()).to.equal('TRX_COMMITTED');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.TRX_ROLLEDBACK);
                expect(sessionStateChanged(proto).getParameter()).to.equal('TRX_ROLLEDBACK');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.PRODUCED_MESSAGE);
                expect(sessionStateChanged(proto).getParameter()).to.equal('PRODUCED_MESSAGE');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.CLIENT_ID_ASSIGNED);
                expect(sessionStateChanged(proto).getParameter()).to.equal('CLIENT_ID_ASSIGNED');

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.GENERATED_DOCUMENT_IDS);
                expect(sessionStateChanged(proto).getParameter()).to.equal('GENERATED_DOCUMENT_IDS');
            });
        });

        context('getParameterId()', () => {
            it('returns the protocol identifier of the type of parameter that changed', () => {
                const proto = new NoticeStub.SessionStateChanged();

                td.when(proto.getParam()).thenReturn(NoticeStub.SessionStateChanged.Parameter.CLIENT_ID_ASSIGNED);
                expect(sessionStateChanged(proto).getParameterId()).to.equal(NoticeStub.SessionStateChanged.Parameter.CLIENT_ID_ASSIGNED);
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Notice.SessionStateChanged message', () => {
                const proto = new NoticeStub.SessionStateChanged();

                const wrapper = sessionStateChanged(proto);
                const getParameter = td.replace(wrapper, 'getParameter');

                td.when(getParameter()).thenReturn('foo');
                td.when(proto.getValueList()).thenReturn(['bar', 'baz']);
                td.when(scalar('bar')).thenReturn({ toJSON: () => 'qux' });
                td.when(scalar('baz')).thenReturn({ toJSON: () => 'quux' });

                expect(wrapper.toJSON()).to.deep.equal({ param: 'foo', value: ['qux', 'quux'] });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of the underlying data', () => {
                const proto = new NoticeStub.SessionStateChanged();

                td.when(proto.getParam()).thenReturn('foo');
                td.when(proto.getValueList()).thenReturn(['bar', 'baz']);
                td.when(scalar('bar')).thenReturn({ toLiteral: () => 'qux' });
                td.when(scalar('baz')).thenReturn({ toLiteral: () => 'quux' });

                expect(sessionStateChanged(proto).toObject()).to.deep.equal({ type: 'foo', values: ['qux', 'quux'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new NoticeStub.SessionStateChanged();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(sessionStateChanged(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
