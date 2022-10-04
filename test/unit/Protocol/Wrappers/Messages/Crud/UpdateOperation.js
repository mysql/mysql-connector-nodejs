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
let UpdateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');

describe('Mysqlx.Crud.UpdateOperation wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        UpdateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let ColumnIdentifier, Expr, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                ColumnIdentifier = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                UpdateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
            });

            it('creates a Mysqlx.Crud.UpdateOperation wrapper of the given type for the given field', () => {
                const proto = new CrudStub.UpdateOperation();
                const protoValue = 'foo';
                const source = 'bar';
                const sourceProto = `${source}_proto`;
                const type = 'baz';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(ColumnIdentifier.create(source)).thenReturn({ valueOf: () => sourceProto });

                expect(UpdateOperation.create({ source, type }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(sourceProto);
                expect(td.explain(proto.setOperation).callCount).to.equal(1);
                expect(td.explain(proto.setOperation).calls[0].args[0]).to.equal(type);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.UpdateOperation wrapper of the given type for the given field with a given value', () => {
                const isLiteral = true;
                const proto = new CrudStub.UpdateOperation();
                const protoValue = 'foo';
                const source = 'bar';
                const sourceProto = `${source}_proto`;
                const type = 'baz';
                const value = 'qux';
                const valueExprProto = `${value}_expr_proto`;

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(ColumnIdentifier.create(source)).thenReturn({ valueOf: () => sourceProto });
                td.when(Expr.create({ value, isLiteral })).thenReturn({ valueOf: () => valueExprProto });

                expect(UpdateOperation.create({ source, type, value, isLiteral }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(sourceProto);
                expect(td.explain(proto.setOperation).callCount).to.equal(1);
                expect(td.explain(proto.setOperation).calls[0].args[0]).to.equal(type);
                expect(td.explain(proto.setValue).callCount).to.equal(1);
                expect(td.explain(proto.setValue).calls[0].args[0]).to.equal(valueExprProto);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the name of the update operation', () => {
                const proto = new CrudStub.UpdateOperation();

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.SET);
                expect(UpdateOperation(proto).getType()).to.equal('SET');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_REMOVE);
                expect(UpdateOperation(proto).getType()).to.equal('ITEM_REMOVE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_SET);
                expect(UpdateOperation(proto).getType()).to.equal('ITEM_SET');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_REPLACE);
                expect(UpdateOperation(proto).getType()).to.equal('ITEM_REPLACE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ITEM_MERGE);
                expect(UpdateOperation(proto).getType()).to.equal('ITEM_MERGE');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ARRAY_INSERT);
                expect(UpdateOperation(proto).getType()).to.equal('ARRAY_INSERT');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.ARRAY_APPEND);
                expect(UpdateOperation(proto).getType()).to.equal('ARRAY_APPEND');

                td.when(proto.getOperation()).thenReturn(CrudStub.UpdateOperation.UpdateType.MERGE_PATCH);
                expect(UpdateOperation(proto).getType()).to.equal('MERGE_PATCH');
            });
        });

        context('toJSON()', () => {
            let ColumnIdentifier, Expr;

            beforeEach('replace dependencies with test doubles', () => {
                ColumnIdentifier = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                // reload module with the replacements
                UpdateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
            });

            it('returns a textual representation of a Mysqlx.Crud.UpdateOperation', () => {
                const proto = new CrudStub.UpdateOperation();
                const operation = 'foo';
                const source = 'bar';
                const sourceProto = `${source}_proto`;
                const value = 'baz';
                const valueProto = `${value}_proto`;

                td.when(proto.getSource()).thenReturn(sourceProto);
                td.when(ColumnIdentifier(sourceProto)).thenReturn({ toJSON: () => source });

                const wrap = UpdateOperation(proto);
                const getType = td.replace(wrap, 'getType');

                td.when(getType()).thenReturn(operation);

                td.when(proto.getValue()).thenReturn(valueProto);
                td.when(Expr(valueProto)).thenReturn({ toJSON: () => value });

                expect(wrap.toJSON()).to.deep.equal({ source, operation, value });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                UpdateOperation = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/UpdateOperation');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.UpdateOperation();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(UpdateOperation(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
