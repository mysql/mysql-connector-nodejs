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
let sessionVariableChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionVariableChanged');

describe('Mysqlx.Notice.SessionVariableChanged wrapper', () => {
    let NoticeStub, bytes, scalar, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        sessionVariableChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionVariableChanged');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Notice.SessionVariableChanged wrap instance based on raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn('baz');
                td.when(NoticeStub.SessionVariableChanged.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(sessionVariableChanged.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Notice.SessionVariableChanged message', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(proto.getParam()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('bar');
                td.when(scalar('bar')).thenReturn({ toJSON: () => 'baz' });

                expect(sessionVariableChanged(proto).toJSON()).to.deep.equal({ param: 'foo', value: 'baz' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of the underlying data', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(proto.getParam()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('bar');
                td.when(scalar('bar')).thenReturn({ toLiteral: () => 'baz' });

                expect(sessionVariableChanged(proto).toObject()).to.deep.equal({ foo: 'baz' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(sessionVariableChanged(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
