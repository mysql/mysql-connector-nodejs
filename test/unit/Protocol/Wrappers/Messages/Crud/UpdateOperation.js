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
let updateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');

describe('Mysqlx.Crud.UpdateOperation wrapper', () => {
    let CrudStub, expr, columnIdentifier, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        columnIdentifier = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        updateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.UpdateOperation wrap instance with values', () => {
                const proto = new CrudStub.UpdateOperation();

                td.when(columnIdentifier.create('foo', {})).thenReturn({ valueOf: () => 'baz' });
                td.when(expr.create('bar', { toParse: false })).thenReturn('qux');
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'quux' });

                expect(updateOperation.create({ source: 'foo', type: CrudStub.UpdateOperation.UpdateType.SET, value: 'bar' }).valueOf()).to.equal('quux');
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal('baz');
                expect(td.explain(proto.setOperation).callCount).to.equal(1);
                expect(td.explain(proto.setOperation).calls[0].args[0]).to.equal(CrudStub.UpdateOperation.UpdateType.SET);
                expect(td.explain(proto.setValue).callCount).to.equal(1);
                expect(td.explain(proto.setValue).calls[0].args[0]).to.equal('qux');
            });

            it('returns a ITEM_REMOVE Mysqlx.Crud.UpdateOperation wrap instance without values', () => {
                const proto = new CrudStub.UpdateOperation();

                td.when(columnIdentifier.create('foo', {})).thenReturn({ valueOf: () => 'baz' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'qux' });

                expect(updateOperation.create({ source: 'foo', type: CrudStub.UpdateOperation.UpdateType.ITEM_REMOVE, value: 'bar' }).valueOf()).to.equal('qux');
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal('baz');
                expect(td.explain(proto.setOperation).callCount).to.equal(1);
                expect(td.explain(proto.setOperation).calls[0].args[0]).to.equal(CrudStub.UpdateOperation.UpdateType.ITEM_REMOVE);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the name of the update operation', () => {
                const proto = new CrudStub.UpdateOperation();

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.SET);
                expect(updateOperation(proto).getType()).to.equal('SET');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_REMOVE);
                expect(updateOperation(proto).getType()).to.equal('ITEM_REMOVE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_SET);
                expect(updateOperation(proto).getType()).to.equal('ITEM_SET');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_REPLACE);
                expect(updateOperation(proto).getType()).to.equal('ITEM_REPLACE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_MERGE);
                expect(updateOperation(proto).getType()).to.equal('ITEM_MERGE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ARRAY_INSERT);
                expect(updateOperation(proto).getType()).to.equal('ARRAY_INSERT');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ARRAY_APPEND);
                expect(updateOperation(proto).getType()).to.equal('ARRAY_APPEND');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.MERGE_PATCH);
                expect(updateOperation(proto).getType()).to.equal('MERGE_PATCH');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.UpdateOperation', () => {
                const proto = new CrudStub.UpdateOperation();
                const wrap = updateOperation(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(proto.getSource()).thenReturn('p_foo');
                td.when(columnIdentifier('p_foo')).thenReturn({ toJSON: () => 'foo' });

                td.when(getType()).thenReturn('bar');

                td.when(proto.getValue()).thenReturn('p_baz');
                td.when(expr('p_baz')).thenReturn({ toJSON: () => 'baz' });

                expect(wrap.toJSON()).to.deep.equal({ source: 'foo', operation: 'bar', value: 'baz' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.UpdateOperation();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(updateOperation(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
