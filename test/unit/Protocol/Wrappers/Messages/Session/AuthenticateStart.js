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
let authenticateStart = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateStart');

describe('Mysqlx.Session.AuthenticateStart wrapper', () => {
    let SessionStub, bytes, serializable, wraps;

    beforeEach('create fakes', () => {
        SessionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_session_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        authenticateStart = require('../../../../../../lib/Protocol/Wrappers/Messages/Session/AuthenticateStart');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Session.AuthenticateStart wrapper instance based on a given authentication mechanism and password', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(bytes.create('bar')).thenReturn({ valueOf: () => 'baz' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'qux' });

                expect(authenticateStart.create('foo', 'bar').valueOf()).to.equal('qux');
                expect(td.explain(proto.setMechName).callCount).to.equal(1);
                expect(td.explain(proto.setMechName).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setAuthData).callCount).to.equal(1);
                expect(td.explain(proto.setAuthData).calls[0].args[0]).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(authenticateStart(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Session.AuthenticateStart message', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(proto.getMechName()).thenReturn('foo');
                td.when(proto.getAuthData()).thenReturn('p_bar');
                td.when(bytes('p_bar')).thenReturn({ toJSON: () => 'bar' });
                td.when(proto.getInitialResponse()).thenReturn('p_baz');
                td.when(bytes('p_baz')).thenReturn({ toJSON: () => 'baz' });

                expect(authenticateStart(proto).toJSON()).to.deep.equal({ mech_name: 'foo', auth_data: 'bar', initial_response: 'baz' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of a Mysqlx.Session.AuthenticateStart message', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(proto.toObject()).thenReturn('foo');

                expect(authenticateStart(proto).toObject()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new SessionStub.AuthenticateStart();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(authenticateStart(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
