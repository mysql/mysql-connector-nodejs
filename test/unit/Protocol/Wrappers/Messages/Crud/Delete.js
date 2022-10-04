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
let Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');

describe('Mysqlx.Crud.Delete wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Collection, Expr, Limit, LimitExpr, Order, Scalar, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
                LimitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
                Order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
            });

            it('creates a Mysqlx.Crud.Delete wrapper without placeholder assignments for a statement to be prepared', () => {
                const count = 'foo';
                const criteria = 'bar';
                const criteriaExpr = 'baz';
                const dataModel = 'qux';
                const limitExpr = 'quux';
                const orderList = ['quuux', 'quuuux'];
                const proto = new CrudStub.Delete();
                const protoValue = 'quuuuux';
                const orderExprList = ['quuuuuux', 'quuuuuuux'];
                const placeholders = ['quuuuuuuux', 'quuuuuuuuux'];
                const schemaName = 'quuuuuuuuuux';
                const schema = { getName: () => schemaName };
                const tableName = 'quuuuuuuuuuux';
                const collection = `${schemaName}.${tableName}`;

                const statement = {
                    getCategory: () => dataModel,
                    getCount_: () => count,
                    getCriteria_: () => criteria,
                    getPlaceholders_: () => placeholders,
                    getOrderList_: () => orderList,
                    getSchema: () => schema,
                    getTableName: () => tableName
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Collection.create({ schemaName, name: tableName })).thenReturn({ valueOf: () => collection });
                td.when(Expr.create({ value: criteria, placeholders })).thenReturn({ valueOf: () => criteriaExpr });
                td.when(LimitExpr.create({ count, position: placeholders.length })).thenReturn({ valueOf: () => limitExpr });
                td.when(Order.create(orderList[0])).thenReturn({ valueOf: () => orderExprList[0] });
                td.when(Order.create(orderList[1])).thenReturn({ valueOf: () => orderExprList[1] });

                expect(Delete.create(statement, { toPrepare: true }).valueOf()).to.deep.equal(protoValue);
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal(collection);
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal(dataModel);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal(criteriaExpr);
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(1);
                expect(td.explain(proto.setLimitExpr).calls[0].args[0]).to.equal(limitExpr);
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(orderExprList);
                expect(td.explain(proto.setArgsList).callCount).to.equal(0);
                expect(td.explain(proto.setLimit).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Delete wrapper with placeholder assignments for a statement to be executed', () => {
                const count = 'foo';
                const criteria = 'bar';
                const criteriaExpr = 'baz';
                const dataModel = 'qux';
                const limit = 'quux';
                const orderList = ['quuux', 'quuuux'];
                const orderExprList = orderList.map(e => `${e}_expr`);
                const placeholders = ['quuuuux', 'quuuuuux'];
                const placeholderValues = placeholders.map(p => `${p}_value`);
                const proto = new CrudStub.Delete();
                const protoValue = 'quuuuuuux';
                const scalarValues = placeholderValues.map(v => `${v}_scalar`);
                const schemaName = 'quuuuuuuux';
                const schema = { getName: () => schemaName };
                const tableName = 'quuuuuuuuux';
                const collection = `${schemaName}.${tableName}`;

                const statement = {
                    getCategory: () => dataModel,
                    getCount_: () => count,
                    getCriteria_: () => criteria,
                    getPlaceholders_: () => placeholders,
                    getPlaceholderValues_: () => placeholderValues,
                    getOrderList_: () => orderList,
                    getSchema: () => schema,
                    getTableName: () => tableName
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Collection.create({ schemaName, name: tableName })).thenReturn({ valueOf: () => collection });
                td.when(Expr.create({ value: criteria, placeholders })).thenReturn({ valueOf: () => criteriaExpr });

                td.when(Scalar.create({ value: placeholderValues[0] })).thenReturn({ valueOf: () => scalarValues[0] });
                // To ensure undefined values are ignored, one of the
                // test-doubles should not return anything.
                td.when(Scalar.create({ value: placeholderValues[1] })).thenReturn({ valueOf: () => {} });

                td.when(Limit.create({ count })).thenReturn({ valueOf: () => limit });
                td.when(Order.create(orderList[0])).thenReturn({ valueOf: () => orderExprList[0] });
                td.when(Order.create(orderList[1])).thenReturn({ valueOf: () => orderExprList[1] });

                expect(Delete.create(statement).valueOf()).to.deep.equal(protoValue);
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                // The list of scalars should not include undefined values.
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal([scalarValues[0]]);
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal(collection);
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal(dataModel);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal(criteriaExpr);
                expect(td.explain(proto.setLimit).callCount).to.equal(1);
                expect(td.explain(proto.setLimit).calls[0].args[0]).to.equal(limit);
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(orderExprList);
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getDataModel()', () => {
            let Polyglot;

            beforeEach('replace dependencies with test doubles', () => {
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                // reload module with the replacements
                Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
            });

            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Delete();

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => 'foo' });

                expect(Delete(proto).getDataModel()).to.equal('foo');
            });
        });

        context('serialize()', () => {
            let Serializable;

            beforeEach('replace dependencies with test doubles', () => {
                Serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
                // reload module with the replacements
                Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
            });

            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Delete();

                td.when(Serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(Delete(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            let Collection, Expr, Limit, LimitExpr, List, Order, Polyglot, Scalar;

            beforeEach('replace dependencies with test doubles', () => {
                Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
                LimitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
                List = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
                Order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                // reload module with the replacements
                Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
            });

            it('returns a textual representation of a Mysqlx.Crud.Delete message', () => {
                const args = ['foo', 'bar'];
                const argListProto = args.map(a => `${a}_proto`);
                const collection = 'foo';
                const collectionProto = `${collection}_proto`;
                const criteria = 'bar';
                const criteriaProto = `${criteria}_proto`;
                const dataModel = 'baz';
                const limit = 'qux';
                const limitProto = `${limit}_proto`;
                const limitExpr = 'quux';
                const limitExprProto = `${limitExpr}_proto`;
                const order = ['quuux', 'quuuux'];
                const orderListProto = order.map(o => `${o}_proto`);
                const orderList = order.map(o => `${o}_wrap`);
                const proto = new CrudStub.Delete();
                const scalarList = args.map(s => `${s}_scalar`);

                td.when(proto.getCollection()).thenReturn(collectionProto);
                td.when(Collection(collectionProto)).thenReturn({ toJSON: () => collection });

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => dataModel });

                td.when(proto.getCriteria()).thenReturn(criteriaProto);
                td.when(Expr(criteriaProto)).thenReturn({ toJSON: () => criteria });

                td.when(proto.getArgsList()).thenReturn(argListProto);
                td.when(Scalar(argListProto[0])).thenReturn(scalarList[0]);
                td.when(Scalar(argListProto[1])).thenReturn(scalarList[1]);
                td.when(List(scalarList)).thenReturn({ toJSON: () => args });

                td.when(proto.getOrderList()).thenReturn(orderListProto);
                td.when(Order(orderListProto[0])).thenReturn(orderList[0]);
                td.when(Order(orderListProto[1])).thenReturn(orderList[1]);
                td.when(List(orderList)).thenReturn({ toJSON: () => order });

                td.when(proto.getLimit()).thenReturn(limitProto);
                td.when(Limit(limitProto)).thenReturn({ toJSON: () => limit });

                td.when(proto.getLimitExpr()).thenReturn(limitExprProto);
                td.when(LimitExpr(limitExprProto)).thenReturn({ toJSON: () => limitExpr });

                expect(Delete(proto).toJSON()).to.deep.equal({ collection, data_model: dataModel, criteria, args, order, limit, limit_expr: limitExpr });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Delete = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Delete();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Delete(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
