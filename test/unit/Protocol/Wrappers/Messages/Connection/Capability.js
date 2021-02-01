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
let capability = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capability');

describe('Mysqlx.Connection.Capability wrapper', () => {
    let ConnectionStub, any, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        capability = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Capability');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub using the input object properties', () => {
                const proto = new ConnectionStub.Capability();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(any.create('b')).thenReturn({ valueOf: () => 'bar' });

                expect(capability.create('a', 'b').valueOf()).to.equal('foo');
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal('a');
                expect(td.explain(proto.setValue).callCount).to.equal(1);
                expect(td.explain(proto.setValue).calls[0].args[0]).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.Capability message', () => {
                const proto = new ConnectionStub.Capability();

                td.when(proto.getName()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('p_bar');
                td.when(any('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(capability(proto).toJSON()).to.deep.equal({ name: 'foo', value: 'bar' });
            });
        });

        context('toObject()', () => {
            it('returns an object containing the key-value pair mapping of given capability', () => {
                const proto = new ConnectionStub.Capability();

                td.when(proto.getName()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('p_bar');
                td.when(any('p_bar')).thenReturn({ toLiteral: () => 'bar' });

                expect(capability(proto).toObject()).to.deep.equal({ foo: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.Capability();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(capability(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
