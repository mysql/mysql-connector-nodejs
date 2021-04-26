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
let stmtExecute = require('../../../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecute');

describe('Mysqlx.Sql.StmtExecute wrapper', () => {
    let SqlStub, any, bytes, list, serializable, wraps;

    beforeEach('create fakes', () => {
        SqlStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_sql_pb');
        any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        stmtExecute = require('../../../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecute');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Sql.StmtExecute wrapper instance', () => {
                const proto = new SqlStub.StmtExecute();
                const statement = { getArgs: td.function(), getNamespace: td.function(), getSQL: td.function() };

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getNamespace()).thenReturn('bar');

                td.when(statement.getSQL()).thenReturn('s_baz');
                td.when(bytes.create(Buffer.from('s_baz'))).thenReturn({ valueOf: () => 'baz' });

                td.when(statement.getArgs()).thenReturn(['s_qux', 's_quux']);
                td.when(any.create('s_qux')).thenReturn({ valueOf: () => 'qux' });
                td.when(any.create('s_quux')).thenReturn({ valueOf: () => 'quux' });

                expect(stmtExecute.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setNamespace).callCount).to.equal(1);
                expect(td.explain(proto.setNamespace).calls[0].args[0]).to.equal('bar');
                expect(td.explain(proto.setStmt).callCount).to.equal(1);
                expect(td.explain(proto.setStmt).calls[0].args[0]).to.equal('baz');
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(['qux', 'quux']);
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new SqlStub.StmtExecute();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(stmtExecute(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Sql.StmtExecute message', () => {
                const proto = new SqlStub.StmtExecute();

                td.when(proto.getNamespace()).thenReturn('foo');

                td.when(proto.getStmt()).thenReturn('p_bar');
                td.when(bytes('p_bar')).thenReturn({ toString: () => 'bar' });

                td.when(proto.getArgsList()).thenReturn(['p_baz', 'p_qux']);
                td.when(any('p_baz')).thenReturn('a_baz');
                td.when(any('p_qux')).thenReturn('a_qux');
                td.when(list(['a_baz', 'a_qux'])).thenReturn({ toJSON: () => ['baz', 'qux'] });

                td.when(proto.getCompactMetadata()).thenReturn('quux');

                expect(stmtExecute(proto).toJSON()).to.deep.equal({ namespace: 'foo', stmt: 'bar', args: ['baz', 'qux'], compact_metadata: 'quux' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new SqlStub.StmtExecute();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(stmtExecute(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
