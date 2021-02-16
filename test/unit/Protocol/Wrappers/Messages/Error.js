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
let error = require('../../../../../lib/Protocol/Wrappers/Messages/Error');

describe('Mysqlx.Error wrapper', () => {
    let MysqlxStub, bytes, serializable, wraps;

    beforeEach('create fakes', () => {
        MysqlxStub = td.replace('../../../../../lib/Protocol/Stubs/mysqlx_pb');
        bytes = td.replace('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        serializable = td.replace('../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        error = require('../../../../../lib/Protocol/Wrappers/Messages/Error');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub', () => {
                const proto = new MysqlxStub.Error();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(error.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setMsg).callCount).to.equal(1);
                expect(td.explain(proto.setMsg).calls[0].args[0]).to.equal('foo');
            });
        });

        context('deserialize()', () => {
            it('returns a Mysqlx.Error wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn('baz');
                td.when(MysqlxStub.Error.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(error.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getSeverity()', () => {
            it('returns the severity of the underlying error', () => {
                const proto = new MysqlxStub.Error();

                td.when(proto.getSeverity()).thenReturn(MysqlxStub.Error.Severity.ERROR);
                expect(error(proto).getSeverity()).to.equal('ERROR');

                td.when(proto.getSeverity()).thenReturn(MysqlxStub.Error.Severity.FATAL);
                expect(error(proto).getSeverity()).to.equal('FATAL');
            });
        });

        context('serialize()', () => {
            it('returns the raw buffer data to be handled by the work queue', () => {
                const proto = new MysqlxStub.Error();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(error(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Error message', () => {
                const proto = new MysqlxStub.Error();
                const wrapper = error(proto);
                const getSeverity = td.replace(wrapper, 'getSeverity');

                td.when(getSeverity()).thenReturn('foo');
                td.when(proto.getCode()).thenReturn('bar');
                td.when(proto.getSqlState()).thenReturn('baz');
                td.when(proto.getMsg()).thenReturn('qux');

                expect(wrapper.toJSON()).to.deep.equal({ severity: 'foo', code: 'bar', sql_state: 'baz', msg: 'qux' });
            });
        });

        context('toObject()', () => {
            it('returns an object with an existing protocol message', () => {
                const proto = new MysqlxStub.Error();

                td.when(proto.toObject()).thenReturn('foo');

                expect(error(proto).toObject()).to.deep.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new MysqlxStub.Error();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(error(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
