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
let ColumnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');

describe('Mysqlx.Expr.ColumnIdentifier wrapper', () => {
    let ExprStub;

    beforeEach('replace dependencies with test doubles', () => {
        ExprStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
        // documentPathItem = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
        // list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        // optionalString = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/OptionalString');
        // parser = td.replace('../../../../../../lib/ExprParser');
        // wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        // reload module with the replacements
        ColumnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let DocumentPathItem, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                DocumentPathItem = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                ColumnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
            });

            it('creates a Mysqlx.Expr.ColumnIdentifier wrapper with a given column or field name components', () => {
                const documentPath = ['foo', 'bar'];
                const documentPathProtoList = documentPath.map(item => `${item}_proto`);
                const name = 'baz';
                const proto = new ExprStub.ColumnIdentifier();
                const protoValue = 'qux';
                const schema = 'quux';
                const table = 'quux';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(DocumentPathItem.create(documentPath[0])).thenReturn({ valueOf: () => documentPathProtoList[0] });
                td.when(DocumentPathItem.create(documentPath[1])).thenReturn({ valueOf: () => documentPathProtoList[1] });

                expect(ColumnIdentifier.create({ documentPath, name, schema, table }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setDocumentPathList).callCount).to.equal(1);
                expect(td.explain(proto.setDocumentPathList).calls[0].args[0]).to.deep.equal(documentPathProtoList);
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal(name);
                expect(td.explain(proto.setTableName).callCount).to.equal(1);
                expect(td.explain(proto.setTableName).calls[0].args[0]).to.equal(table);
                expect(td.explain(proto.setSchemaName).callCount).to.equal(1);
                expect(td.explain(proto.setSchemaName).calls[0].args[0]).to.equal(schema);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            let DocumentPathItem, List, OptionalString;

            beforeEach('replace dependencies with test doubles', () => {
                DocumentPathItem = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
                List = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
                OptionalString = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/OptionalString');
                // reload module with the replacements
                ColumnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
            });

            it('returns a textual representation of a Mysqlx.Expr.ColumnIdentifier message', () => {
                const documentPath = ['foo', 'bar'];
                const documentPathWrapperList = documentPath.map(item => `${item}_wrap`);
                const documentPathProtoList = documentPath.map(item => `${item}_proto`);
                const name = 'baz';
                const optionalName = `${name}_opt`;
                const schemaName = 'qux';
                const optionalSchemaName = `${schemaName}_opt`;
                const tableName = 'quux';
                const optionalTableName = `${tableName}_opt`;
                const proto = new ExprStub.ColumnIdentifier();

                td.when(proto.getDocumentPathList()).thenReturn(documentPathProtoList);
                td.when(DocumentPathItem(documentPathProtoList[0])).thenReturn(documentPathWrapperList[0]);
                td.when(DocumentPathItem(documentPathProtoList[1])).thenReturn(documentPathWrapperList[1]);
                td.when(List(documentPathWrapperList)).thenReturn({ toJSON: () => documentPath });

                td.when(proto.getName()).thenReturn(optionalName);
                td.when(OptionalString(optionalName)).thenReturn({ toJSON: () => name });

                td.when(proto.getTableName()).thenReturn(optionalTableName);
                td.when(OptionalString(optionalTableName)).thenReturn({ toJSON: () => tableName });

                td.when(proto.getSchemaName()).thenReturn(optionalSchemaName);
                td.when(OptionalString(optionalSchemaName)).thenReturn({ toJSON: () => schemaName });

                expect(ColumnIdentifier(proto).toJSON()).to.deep.equal({ document_path: documentPath, name, table_name: tableName, schema_name: schemaName });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                ColumnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.ColumnIdentifier();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(ColumnIdentifier(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
