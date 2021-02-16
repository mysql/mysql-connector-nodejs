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
let capabilities = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');

describe('Mysqlx.Connection.Capabilities wrapper', () => {
    let ConnectionStub, bytes, capability, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        capability = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capability');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capabilities = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub using the input object properties', () => {
                const proto = new ConnectionStub.Capabilities();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(capability.create('a', 'name')).thenReturn({ valueOf: () => 'bar' });
                td.when(capability.create('b', 42)).thenReturn({ valueOf: () => 'baz' });

                expect(capabilities.create({ a: 'name', b: 42 }).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCapabilitiesList).callCount).to.equal(1);
                expect(td.explain(proto.setCapabilitiesList).calls[0].args[0]).to.deep.equal(['bar', 'baz']);
            });
        });

        context('deserialize()', () => {
            it('returns a wrapper instance based from the raw protocol message', () => {
                td.when(bytes.deserialize('foo')).thenReturn('bar');
                td.when(ConnectionStub.Capabilities.deserializeBinary('bar')).thenReturn('baz');
                td.when(wraps('baz')).thenReturn({ valueOf: () => 'qux' });

                expect(capabilities.deserialize('foo').valueOf()).to.deep.equal('qux');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.Capabilities message', () => {
                const proto = new ConnectionStub.Capabilities();

                td.when(proto.getCapabilitiesList()).thenReturn(['p_foo', 'p_bar']);
                td.when(capability('p_foo')).thenReturn({ toJSON: () => 'foo' });
                td.when(capability('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(capabilities(proto).toJSON()).to.deep.equal({ capabilities: ['foo', 'bar'] });
            });
        });

        context('toObject()', () => {
            it('returns an object containing the key-value pair mappings of the existing capabilities', () => {
                const proto = new ConnectionStub.Capabilities();

                td.when(proto.getCapabilitiesList()).thenReturn(['p_foo', 'p_bar']);
                td.when(capability('p_foo')).thenReturn({ toObject: () => ({ foo: 'w_foo' }) });
                td.when(capability('p_bar')).thenReturn({ toObject: () => ({ bar: 'w_bar' }) });

                expect(capabilities(proto).toObject()).to.deep.equal({ foo: 'w_foo', bar: 'w_bar' });
            });
        });
    });

    context('valueOf()', () => {
        it('returns the underlying protobuf stub instance', () => {
            const proto = new ConnectionStub.Capabilities();

            td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

            expect(capabilities(proto).valueOf()).to.equal('foo');
        });
    });
});
