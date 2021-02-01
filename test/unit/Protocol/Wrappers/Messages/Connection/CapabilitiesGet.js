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
let capabilitiesGet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesGet');

describe('Mysqlx.Connection.CapabilitiesGet wrapper', () => {
    let ConnectionStub, empty, serializable, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capabilitiesGet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesGet');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub', () => {
                td.when(wraps(td.matchers.argThat(v => v instanceof ConnectionStub.CapabilitiesGet))).thenReturn({ valueOf: () => 'foo' });

                expect(capabilitiesGet.create().valueOf()).to.equal('foo');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ConnectionStub.CapabilitiesGet();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(capabilitiesGet(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.CapabilitiesGet message', () => {
                const proto = new ConnectionStub.CapabilitiesGet();

                td.when(empty(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(capabilitiesGet(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.CapabilitiesGet();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(capabilitiesGet(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
