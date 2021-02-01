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
let oneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');

describe('Mysqlx.Prepare.Prepare.OneOfMessage wrapper', () => {
    let PrepareStub, crudDelete, crudFind, crudUpdate, wraps;

    beforeEach('create fakes', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        crudDelete = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
        crudFind = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
        crudUpdate = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Update');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        oneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Prepare.Prepare.OneOfMessage wrap instance for a Mysqlx.Crud.Find message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const statement = { getType: td.function() };

                td.when(statement.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.FIND);
                td.when(crudFind.create(statement, 'foo')).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(oneOfMessage.create(statement, 'foo').valueOf()).to.equal('baz');
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(PrepareStub.Prepare.OneOfMessage.Type.FIND);
                expect(td.explain(proto.setFind).callCount).to.equal(1);
                expect(td.explain(proto.setFind).calls[0].args[0]).to.equal('bar');
                expect(td.explain(proto.setDelete).callCount).to.equal(0);
                expect(td.explain(proto.setUpdate).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for a Mysqlx.Crud.Update message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const statement = { getType: td.function() };

                td.when(statement.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                td.when(crudUpdate.create(statement, 'foo')).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(oneOfMessage.create(statement, 'foo').valueOf()).to.equal('baz');
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                expect(td.explain(proto.setUpdate).callCount).to.equal(1);
                expect(td.explain(proto.setUpdate).calls[0].args[0]).to.equal('bar');
                expect(td.explain(proto.setDelete).callCount).to.equal(0);
                expect(td.explain(proto.setFind).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for a Mysqlx.Crud.Delete message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const statement = { getType: td.function() };

                td.when(statement.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                td.when(crudDelete.create(statement, 'foo')).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(oneOfMessage.create(statement, 'foo').valueOf()).to.equal('baz');
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                expect(td.explain(proto.setDelete).callCount).to.equal(1);
                expect(td.explain(proto.setDelete).calls[0].args[0]).to.equal('bar');
                expect(td.explain(proto.setFind).callCount).to.equal(0);
                expect(td.explain(proto.setUpdate).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for an unknown message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const statement = { getType: td.function() };

                td.when(statement.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UNKNOWN);
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(oneOfMessage.create(statement, 'foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(PrepareStub.Prepare.OneOfMessage.Type.UNKNOWN);
                expect(td.explain(proto.setFind).callCount).to.equal(0);
                expect(td.explain(proto.setDelete).callCount).to.equal(0);
                expect(td.explain(proto.setUpdate).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the type name of the underyling CRUD message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.FIND);
                expect(oneOfMessage(proto).getType()).to.equal('FIND');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.INSERT);
                expect(oneOfMessage(proto).getType()).to.equal('INSERT');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                expect(oneOfMessage(proto).getType()).to.equal('UPDATE');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                expect(oneOfMessage(proto).getType()).to.equal('DELETE');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.STMT);
                expect(oneOfMessage(proto).getType()).to.equal('STMT');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Find message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                const wrap = oneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn('foo');
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.FIND);
                td.when(proto.getFind()).thenReturn('p_bar');
                td.when(crudFind('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo', find: 'bar' });
            });

            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Update message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                const wrap = oneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn('foo');
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                td.when(proto.getUpdate()).thenReturn('p_bar');
                td.when(crudUpdate('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo', update: 'bar' });
            });

            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Delete message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                const wrap = oneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn('foo');
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                td.when(proto.getDelete()).thenReturn('p_bar');
                td.when(crudDelete('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo', delete: 'bar' });
            });

            it('returns an incomplete representation of Mysqlx.Prepare.Prepare.OneOfMessage for an unknown message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                const wrap = oneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn('foo');
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UNKNOWN);

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(oneOfMessage(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
