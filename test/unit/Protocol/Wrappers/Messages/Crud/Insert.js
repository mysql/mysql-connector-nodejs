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
let Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');

describe('Mysqlx.Crud.Insert wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Collection, Column, TypedRow, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
                Column = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');
                TypedRow = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
            });

            it('creates a Mysqlx.Crud.Insert wrapper with the given boundaries', () => {
                const proto = new CrudStub.Insert();
                const collection = 'foo';
                const columns = ['bar', 'baz'];
                const columnValues = columns.map(c => `${c}_value`);
                const dataModel = 'qux';
                const rows = ['quux', 'quuux'];
                const typedRows = rows.map(r => `${r}_typed`);
                const schemaName = 'quuuux';
                const tableName = 'quuuuux';
                const protoValue = 'quuuuuux';
                const upsert = 'quuuuuuux';
                const statement = { columns, dataModel, rows, schemaName, tableName, upsert };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Collection.create({ name: tableName, schemaName })).thenReturn({ valueOf: () => collection });
                td.when(Column.create(columns[0])).thenReturn({ valueOf: () => columnValues[0] });
                td.when(Column.create(columns[1])).thenReturn({ valueOf: () => columnValues[1] });
                td.when(TypedRow.create(rows[0])).thenReturn({ valueOf: () => typedRows[0] });
                td.when(TypedRow.create(rows[1])).thenReturn({ valueOf: () => typedRows[1] });

                expect(Insert.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal(collection);
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal(dataModel);
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(columnValues);
                expect(td.explain(proto.setRowList).callCount).to.equal(1);
                expect(td.explain(proto.setRowList).calls[0].args[0]).to.deep.equal(typedRows);
                expect(td.explain(proto.setUpsert).callCount).to.equal(1);
                expect(td.explain(proto.setUpsert).calls[0].args[0]).to.equal(upsert);
            });
        });
    });

    context('instance methods', () => {
        context('getDataModel()', () => {
            let Polyglot;

            beforeEach('replace dependencies with test doubles', () => {
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                // reload module with the replacements
                Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
            });

            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Insert();
                const expected = 'foo';

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => expected });

                expect(Insert(proto).getDataModel()).to.equal('foo');
            });
        });

        context('serialize()', () => {
            let Serializable;

            beforeEach('replace dependencies with test doubles', () => {
                Serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
                // reload module with the replacements
                Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
            });

            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Insert();
                const expected = 'foo';

                td.when(Serializable(proto)).thenReturn({ serialize: () => expected });

                expect(Insert(proto).serialize()).to.equal(expected);
            });
        });

        context('toJSON()', () => {
            let Collection, Column, List, Polyglot, Scalar, TypedRow;

            beforeEach('replace dependencies with test doubles', () => {
                Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
                Column = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');
                List = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                TypedRow = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
                // reload module with the replacements
                Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
            });

            it('returns a textual representation of a Mysqlx.Crud.Insert message', () => {
                const args = ['foo', 'bar'];
                const argListProto = args.map(a => `${a}_proto`);
                const collection = 'foo';
                const collectionProto = `${collection}_proto`;
                const dataModel = 'bar';
                const projection = ['baz', 'qux'];
                const columnListProto = projection.map(c => `${c}_proto`);
                const columnList = projection.map(c => `${c}_wrap`);
                const proto = new CrudStub.Insert();
                const row = ['quux', 'quuux'];
                const rowProto = row.map(r => `${r}_proto`);
                const scalarList = args.map(s => `${s}_scalar`);
                const valueList = row.map(r => `${r}_wrap`);
                const upsert = 'quuuux';

                td.when(proto.getCollection()).thenReturn(collectionProto);
                td.when(Collection(collectionProto)).thenReturn({ toJSON: () => collection });

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => dataModel });

                td.when(proto.getProjectionList()).thenReturn(columnListProto);
                td.when(Column(columnListProto[0])).thenReturn(columnList[0]);
                td.when(Column(columnListProto[1])).thenReturn(columnList[1]);
                td.when(List(columnList)).thenReturn({ toJSON: () => projection });

                td.when(proto.getRowList()).thenReturn(rowProto);
                td.when(TypedRow(rowProto[0])).thenReturn(valueList[0]);
                td.when(TypedRow(rowProto[1])).thenReturn(valueList[1]);
                td.when(List(valueList)).thenReturn({ toJSON: () => row });

                td.when(proto.getArgsList()).thenReturn(argListProto);
                td.when(Scalar(argListProto[0])).thenReturn(scalarList[0]);
                td.when(Scalar(argListProto[1])).thenReturn(scalarList[1]);
                td.when(List(scalarList)).thenReturn({ toJSON: () => args });

                td.when(proto.getUpsert()).thenReturn(upsert);

                expect(Insert(proto).toJSON()).to.deep.equal({ collection, data_model: dataModel, projection, row, args, upsert });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Insert = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Insert();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Insert(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
