/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

// subject under test needs to be reloaded with replacement test doubles
let OneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');

describe('Mysqlx.Prepare.Prepare.OneOfMessage wrapper', () => {
    let PrepareStub;

    beforeEach('replace dependencies with test doubles', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        // reload module with the replacements
        OneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let CrudFind, CrudDelete, CrudUpdate, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                CrudDelete = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
                CrudFind = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
                CrudUpdate = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Update');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                OneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
            });

            it('creates a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for a Mysqlx.Crud.Find message', () => {
                const crudFindProto = 'foo';
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const protoValue = 'bar';
                const type = PrepareStub.Prepare.OneOfMessage.Type.FIND;
                const statement = { getType: () => type };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(CrudFind.create(statement, { toPrepare: true })).thenReturn({ valueOf: () => crudFindProto });

                expect(OneOfMessage.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(proto.setFind).callCount).to.equal(1);
                expect(td.explain(proto.setFind).calls[0].args[0]).to.equal(crudFindProto);
                expect(td.explain(proto.setDelete).callCount).to.equal(0);
                expect(td.explain(proto.setUpdate).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for a Mysqlx.Crud.Update message', () => {
                const crudUpdateProto = 'foo';
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const protoValue = 'bar';
                const type = PrepareStub.Prepare.OneOfMessage.Type.UPDATE;
                const statement = { getType: () => type };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(CrudUpdate.create(statement, { toPrepare: true })).thenReturn({ valueOf: () => crudUpdateProto });

                expect(OneOfMessage.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(proto.setUpdate).callCount).to.equal(1);
                expect(td.explain(proto.setUpdate).calls[0].args[0]).to.equal(crudUpdateProto);
                expect(td.explain(proto.setDelete).callCount).to.equal(0);
                expect(td.explain(proto.setFind).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Prepare.Prepare.OneOfMessage wrapper for a Mysqlx.Crud.Delete message', () => {
                const crudDeleteProto = 'foo';
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const protoValue = 'bar';
                const type = PrepareStub.Prepare.OneOfMessage.Type.DELETE;
                const statement = { getType: () => type };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(CrudDelete.create(statement, { toPrepare: true })).thenReturn({ valueOf: () => crudDeleteProto });

                expect(OneOfMessage.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(proto.setDelete).callCount).to.equal(1);
                expect(td.explain(proto.setDelete).calls[0].args[0]).to.equal(crudDeleteProto);
                expect(td.explain(proto.setFind).callCount).to.equal(0);
                expect(td.explain(proto.setUpdate).callCount).to.equal(0);
            });

            it('creates an empty Mysqlx.Prepare.Prepare.OneOfMessage wrapper for an unknown message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const protoValue = 'foo';
                const type = PrepareStub.Prepare.OneOfMessage.Type.UNKNOWN;
                const statement = { getType: () => type };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(OneOfMessage.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(type);
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
                expect(OneOfMessage(proto).getType()).to.equal('FIND');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.INSERT);
                expect(OneOfMessage(proto).getType()).to.equal('INSERT');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                expect(OneOfMessage(proto).getType()).to.equal('UPDATE');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                expect(OneOfMessage(proto).getType()).to.equal('DELETE');

                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.STMT);
                expect(OneOfMessage(proto).getType()).to.equal('STMT');
            });
        });

        context('toJSON()', () => {
            let CrudDelete, CrudFind, CrudUpdate;

            beforeEach('replace dependencies with test doubles', () => {
                PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
                CrudDelete = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
                CrudFind = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
                CrudUpdate = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Update');
                // reload module with the replacements
                OneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
            });

            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Find message', () => {
                const find = 'foo';
                const findProto = `${find}_proto`;
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const type = 'foo';

                const wrap = OneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn(type);
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.FIND);
                td.when(proto.getFind()).thenReturn(findProto);
                td.when(CrudFind(findProto)).thenReturn({ toJSON: () => find });

                expect(wrap.toJSON()).to.deep.equal({ type, find });
            });

            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Update message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const type = 'foo';
                const update = 'bar';
                const updateProto = `${update}_bar`;

                const wrap = OneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn(type);
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UPDATE);
                td.when(proto.getUpdate()).thenReturn(updateProto);
                td.when(CrudUpdate(updateProto)).thenReturn({ toJSON: () => update });

                expect(wrap.toJSON()).to.deep.equal({ type, update });
            });

            it('returns a textual representation of Mysqlx.Prepare.Prepare.OneOfMessage for a Mysqlx.Crud.Delete message', () => {
                // "delete" is a keyword
                const deleteJSON = 'foo';
                const deleteProto = `${deleteJSON}_proto`;
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const type = 'bar';

                const wrap = OneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn(type);
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.DELETE);
                td.when(proto.getDelete()).thenReturn(deleteProto);
                td.when(CrudDelete(deleteProto)).thenReturn({ toJSON: () => deleteJSON });

                expect(wrap.toJSON()).to.deep.equal({ type, delete: deleteJSON });
            });

            it('returns an incomplete representation of Mysqlx.Prepare.Prepare.OneOfMessage for an unknown message', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const type = 'foo';

                const wrap = OneOfMessage(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn(type);
                td.when(proto.getType()).thenReturn(PrepareStub.Prepare.OneOfMessage.Type.UNKNOWN);

                expect(wrap.toJSON()).to.deep.equal({ type });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                OneOfMessage = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Prepare.OneOfMessage();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(OneOfMessage(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
