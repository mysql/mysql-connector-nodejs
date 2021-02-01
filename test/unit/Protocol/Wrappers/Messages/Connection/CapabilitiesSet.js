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
let capabilitiesSet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesSet');

describe('Mysqlx.Connection.CapabilitiesSet wrapper', () => {
    let ConnectionStub, capabilities, serializable, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        capabilities = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capabilitiesSet = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/CapabilitiesSet');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Connection.CapabilitiesSet wrapper instance', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(capabilities.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(capabilitiesSet.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setCapabilities).callCount).to.equal(1);
                expect(td.explain(proto.setCapabilities).calls[0].args[0]).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(capabilitiesSet(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.CapabilitiesSet message', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(proto.getCapabilities()).thenReturn('p_foo');
                td.when(capabilities('p_foo')).thenReturn({ toJSON: () => 'foo' });

                expect(capabilitiesSet(proto).toJSON()).to.deep.equal({ capabilities: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.CapabilitiesSet();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(capabilitiesSet(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
