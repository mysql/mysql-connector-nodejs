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

                td.when(bytes.create('foo')).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(authenticateContinue.create('foo').valueOf()).to.equal('baz');
                expect(td.explain(proto.setAuthData).callCount).to.equal(1);
                expect(td.explain(proto.setAuthData).calls[0].args[0]).to.equal('bar');
            });
        });

        context('deserialize()', () => {
            it('returns a Mysqlx.Session.AuthenticateContinue wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn('baz');
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
