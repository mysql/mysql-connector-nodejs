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
let Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');

describe('Mysqlx.Crud.Find wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        let Collection, Expr, Limit, LimitExpr, Order, Projection, Scalar, Wraps;

        beforeEach('replace dependencies with test doubles', () => {
            Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
            Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
            Limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
            LimitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
            Order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
            Projection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
            Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
            Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
            // reload module with the replacements
            Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
        });

        context('create()', () => {
            it('creates a Mysqlx.Crud.Find wrapper without placeholder assignments for a statement to be prepared', () => {
                const count = 'foo';
                const criteria = 'bar';
                const criteriaExpr = `${criteria}_expr`;
                const dataModel = 'baz';
                const groupingCriteria = 'qux';
                const groupingCriteriaExpr = `${groupingCriteria}_expr`;
                const groupingList = ['qux', 'quux'];
                const groupingExprList = groupingList.map(e => `${e}_expr`);
                const limitExpr = 'quuux';
                const lock = 'quuuux';
                const lockOptions = 'quuuuux';
                const offset = 'quuuuuux';
                const orderList = ['quuuuuuux', 'quuuuuuuux'];
                const orderExprList = orderList.map(e => `${e}_expr`);
                const placeholders = ['quuuuuuuuux', 'quuuuuuuuuux'];
                const projectionList = ['quuuuuuuuuuux', 'quuuuuuuuuuuux'];
                const projectionExprList = projectionList.map(e => `${e}_expr`);
                const proto = new CrudStub.Find();
                const protoValue = 'quuuuuuuuuuuuux';
                const schemaName = 'quuuuuuuuuuuuuux';
                const schema = { getName: () => schemaName };
                const tableName = 'quuuuuuuuuuuuuuux';
                const collection = `${schemaName}.${tableName}`;

                const statement = {
                    getCategory: () => dataModel,
                    getCount_: () => count,
                    getCriteria_: () => criteria,
                    getGroupingList_: () => groupingList,
                    getGroupingCriteria_: () => groupingCriteria,
                    getLock_: () => lock,
                    getLockOptions_: () => lockOptions,
                    getOffset_: () => offset,
                    getOrderList_: () => orderList,
                    getPlaceholders_: () => placeholders,
                    getProjectionList_: () => projectionList,
                    getSchema: () => schema,
                    getTableName: () => tableName
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Collection.create({ schemaName, name: tableName })).thenReturn({ valueOf: () => collection });
                td.when(Projection.create(projectionList[0])).thenReturn({ valueOf: () => projectionExprList[0] });
                td.when(Projection.create(projectionList[1])).thenReturn({ valueOf: () => projectionExprList[1] });
                td.when(Expr.create({ value: criteria, placeholders })).thenReturn({ valueOf: () => criteriaExpr });
                td.when(LimitExpr.create({ count, offset, position: placeholders.length })).thenReturn({ valueOf: () => limitExpr });
                td.when(Order.create(orderList[0])).thenReturn({ valueOf: () => orderExprList[0] });
                td.when(Order.create(orderList[1])).thenReturn({ valueOf: () => orderExprList[1] });
                td.when(Expr.create({ value: groupingList[0] })).thenReturn({ valueOf: () => groupingExprList[0] });
                td.when(Expr.create({ value: groupingList[1] })).thenReturn({ valueOf: () => groupingExprList[1] });
                td.when(Expr.create({ value: groupingCriteria })).thenReturn({ valueOf: () => groupingCriteriaExpr });

                expect(Find.create(statement, { toPrepare: true }).valueOf()).to.deep.equal(protoValue);
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal(collection);
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal(dataModel);
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(projectionExprList);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal(criteriaExpr);
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(1);
                expect(td.explain(proto.setLimitExpr).calls[0].args[0]).to.equal(limitExpr);
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(orderExprList);
                expect(td.explain(proto.setGroupingList).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingList).calls[0].args[0]).to.deep.equal(groupingExprList);
                expect(td.explain(proto.setGroupingCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingCriteria).calls[0].args[0]).to.equal(groupingCriteriaExpr);
                expect(td.explain(proto.setLocking).callCount).to.equal(1);
                expect(td.explain(proto.setLocking).calls[0].args[0]).to.equal(lock);
                expect(td.explain(proto.setLockingOptions).callCount).to.equal(1);
                expect(td.explain(proto.setLockingOptions).calls[0].args[0]).to.equal(lockOptions);
                expect(td.explain(proto.setArgsList).callCount).to.equal(0);
                expect(td.explain(proto.setLimit).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Find wrap instance with placeholder assignments for a statement to be executed', () => {
                const count = 'foo';
                const criteria = 'bar';
                const criteriaExpr = `${criteria}_expr`;
                const dataModel = 'baz';
                const groupingCriteria = 'qux';
                const groupingCriteriaExpr = `${groupingCriteria}_expr`;
                const groupingList = ['qux', 'quux'];
                const groupingExprList = groupingList.map(e => `${e}_expr`);
                const limit = 'quuux';
                const lock = 'quuuux';
                const lockOptions = 'quuuuux';
                const offset = 'quuuuuux';
                const orderList = ['quuuuuuux', 'quuuuuuuux'];
                const orderExprList = orderList.map(e => `${e}_expr`);
                const placeholders = ['quuuuuuuuux', 'quuuuuuuuuux'];
                const placeholderValues = placeholders.map(p => `${p}_value`);
                const projectionList = ['quuuuuuuuuuux', 'quuuuuuuuuuuux'];
                const projectionExprList = projectionList.map(e => `${e}_expr`);
                const proto = new CrudStub.Find();
                const protoValue = 'quuuuuuuuuuuuux';
                const scalarValues = placeholderValues.map(v => `${v}_scalar`);
                const schemaName = 'quuuuuuuuuuuuuux';
                const schema = { getName: () => schemaName };
                const tableName = 'quuuuuuuuuuuuuuux';
                const collection = `${schemaName}.${tableName}`;

                const statement = {
                    getCategory: () => dataModel,
                    getCount_: () => count,
                    getCriteria_: () => criteria,
                    getGroupingList_: () => groupingList,
                    getGroupingCriteria_: () => groupingCriteria,
                    getLock_: () => lock,
                    getLockOptions_: () => lockOptions,
                    getOffset_: () => offset,
                    getOrderList_: () => orderList,
                    getPlaceholders_: () => placeholders,
                    getPlaceholderValues_: () => placeholderValues,
                    getProjectionList_: () => projectionList,
                    getSchema: () => schema,
                    getTableName: () => tableName
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Collection.create({ schemaName, name: tableName })).thenReturn({ valueOf: () => collection });
                td.when(Projection.create(projectionList[0])).thenReturn({ valueOf: () => projectionExprList[0] });
                td.when(Projection.create(projectionList[1])).thenReturn({ valueOf: () => projectionExprList[1] });
                td.when(Expr.create({ value: criteria, placeholders })).thenReturn({ valueOf: () => criteriaExpr });

                td.when(Scalar.create({ value: placeholderValues[0] })).thenReturn({ valueOf: () => scalarValues[0] });
                // To ensure undefined values are ignored, one of the
                // test-doubles should not return anything.
                td.when(Scalar.create({ value: placeholderValues[1] })).thenReturn({ valueOf: () => {} });

                td.when(Limit.create({ count, offset })).thenReturn({ valueOf: () => limit });
                td.when(Order.create(orderList[0])).thenReturn({ valueOf: () => orderExprList[0] });
                td.when(Order.create(orderList[1])).thenReturn({ valueOf: () => orderExprList[1] });
                td.when(Expr.create({ value: groupingList[0] })).thenReturn({ valueOf: () => groupingExprList[0] });
                td.when(Expr.create({ value: groupingList[1] })).thenReturn({ valueOf: () => groupingExprList[1] });
                td.when(Expr.create({ value: groupingCriteria })).thenReturn({ valueOf: () => groupingCriteriaExpr });

                expect(Find.create(statement).valueOf()).to.deep.equal(protoValue);
                expect(td.explain(proto.setCollection).callCount).to.equal(1);
                expect(td.explain(proto.setCollection).calls[0].args[0]).to.equal(collection);
                expect(td.explain(proto.setDataModel).callCount).to.equal(1);
                expect(td.explain(proto.setDataModel).calls[0].args[0]).to.equal(dataModel);
                expect(td.explain(proto.setProjectionList).callCount).to.equal(1);
                expect(td.explain(proto.setProjectionList).calls[0].args[0]).to.deep.equal(projectionExprList);
                expect(td.explain(proto.setCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setCriteria).calls[0].args[0]).to.equal(criteriaExpr);
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal([scalarValues[0]]);
                expect(td.explain(proto.setLimit).callCount).to.equal(1);
                expect(td.explain(proto.setLimit).calls[0].args[0]).to.deep.equal(limit);
                expect(td.explain(proto.setOrderList).callCount).to.equal(1);
                expect(td.explain(proto.setOrderList).calls[0].args[0]).to.deep.equal(orderExprList);
                expect(td.explain(proto.setGroupingList).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingList).calls[0].args[0]).to.deep.equal(groupingExprList);
                expect(td.explain(proto.setGroupingCriteria).callCount).to.equal(1);
                expect(td.explain(proto.setGroupingCriteria).calls[0].args[0]).to.equal(groupingCriteriaExpr);
                expect(td.explain(proto.setLocking).callCount).to.equal(1);
                expect(td.explain(proto.setLocking).calls[0].args[0]).to.equal(lock);
                expect(td.explain(proto.setLockingOptions).callCount).to.equal(1);
                expect(td.explain(proto.setLockingOptions).calls[0].args[0]).to.equal(lockOptions);
                expect(td.explain(proto.setLimitExpr).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getLockOptions()', () => {
            it('returns the name of the extended lock option', () => {
                const proto = new CrudStub.Find();

                td.when(proto.getLockingOptions()).thenReturn(CrudStub.Find.RowLockOptions.NOWAIT);
                expect(Find(proto).getLockOptions()).to.equal('NOWAIT');

                td.when(proto.getLockingOptions()).thenReturn(CrudStub.Find.RowLockOptions.SKIP_LOCKED);
                expect(Find(proto).getLockOptions()).to.equal('SKIP_LOCKED');
            });
        });

        context('getLockType()', () => {
            it('returns the name of the lock type', () => {
                const proto = new CrudStub.Find();

                td.when(proto.getLocking()).thenReturn(CrudStub.Find.RowLock.SHARED_LOCK);
                expect(Find(proto).getLockType()).to.equal('SHARED_LOCK');

                td.when(proto.getLocking()).thenReturn(CrudStub.Find.RowLock.EXCLUSIVE_LOCK);
                expect(Find(proto).getLockType()).to.equal('EXCLUSIVE_LOCK');
            });
        });

        context('getDataModel()', () => {
            let Polyglot;

            beforeEach('replace dependencies with test doubles', () => {
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                // reload module with the replacements
                Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
            });

            it('returns the name of the underlying data model', () => {
                const proto = new CrudStub.Find();
                const expected = 'foo';

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => expected });

                expect(Find(proto).getDataModel()).to.equal(expected);
            });
        });

        context('serialize()', () => {
            let Serializable;

            beforeEach('replace dependencies with test doubles', () => {
                Serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
                // reload module with the replacements
                Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
            });

            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new CrudStub.Find();
                const expected = 'foo';

                td.when(Serializable(proto)).thenReturn({ serialize: () => expected });

                expect(Find(proto).serialize()).to.equal(expected);
            });
        });

        context('toJSON()', () => {
            let Collection, Expr, Limit, LimitExpr, List, Order, Polyglot, Projection, Scalar;

            beforeEach('replace dependencies with test doubles', () => {
                Collection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Limit = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
                LimitExpr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
                List = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
                Order = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
                Polyglot = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
                Projection = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                // reload module with the replacements
                Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
            });

            it('returns a textual representation of a Mysqlx.Crud.Find', () => {
                const args = ['foo', 'bar'];
                const argListProto = args.map(a => `${a}_proto`);
                const collection = 'foo';
                const collectionProto = `${collection}_proto`;
                const criteria = 'bar';
                const criteriaProto = `${criteria}_proto`;
                const dataModel = 'baz';
                const grouping = ['qux', 'quux'];
                const groupingCriteria = 'quuux';
                const groupingCriteriaProto = `${groupingCriteria}_proto`;
                const groupingList = grouping.map(g => `${g}_wrap`);
                const groupingListProto = grouping.map(g => `${g}_proto`);
                const limit = 'quuuux';
                const limitProto = `${limit}_proto`;
                const limitExpr = 'quuuuux';
                const limitExprProto = `${limitExpr}_proto`;
                const locking = 'quuuuuux';
                const lockingOptions = 'quuuuuuux';
                const order = ['quuuuuuuux', 'quuuuuuuuux'];
                const orderList = order.map(o => `${o}_wrap`);
                const orderListProto = order.map(o => `${o}_proto`);
                const projection = ['quuuuuuuuuux', 'quuuuuuuuuuux'];
                const projectionList = projection.map(p => `${p}_wrap`);
                const projectionListProto = projection.map(p => `${p}_proto`);
                const proto = new CrudStub.Find();
                const scalarList = args.map(s => `${s}_scalar`);

                td.when(proto.getCollection()).thenReturn(collectionProto);
                td.when(Collection(collectionProto)).thenReturn({ toJSON: () => collection });

                td.when(Polyglot(proto)).thenReturn({ getDataModel: () => dataModel });

                td.when(proto.getProjectionList()).thenReturn(projectionListProto);
                td.when(Projection(projectionListProto[0])).thenReturn(projectionList[0]);
                td.when(Projection(projectionListProto[1])).thenReturn(projectionList[1]);
                td.when(List(projectionList)).thenReturn({ toJSON: () => projection });

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

                td.when(proto.getGroupingList()).thenReturn(groupingListProto);
                td.when(Expr(groupingListProto[0])).thenReturn(groupingList[0]);
                td.when(Expr(groupingListProto[1])).thenReturn(groupingList[1]);
                td.when(List(groupingList)).thenReturn({ toJSON: () => grouping });

                td.when(proto.getGroupingCriteria()).thenReturn(groupingCriteriaProto);
                td.when(Expr(groupingCriteriaProto)).thenReturn({ toJSON: () => groupingCriteria });

                const wrapper = Find(proto);

                const getLockOptions = td.replace(wrapper, 'getLockOptions');
                const getLockType = td.replace(wrapper, 'getLockType');

                td.when(getLockType()).thenReturn(locking);
                td.when(getLockOptions()).thenReturn(lockingOptions);

                td.when(proto.getLimit()).thenReturn(limitProto);
                td.when(Limit(limitProto)).thenReturn({ toJSON: () => limit });

                td.when(proto.getLimitExpr()).thenReturn(limitExprProto);
                td.when(LimitExpr(limitExprProto)).thenReturn({ toJSON: () => limitExpr });

                expect(wrapper.toJSON()).to.deep.equal({ collection, data_model: dataModel, projection, criteria, args, order, grouping, grouping_criteria: groupingCriteria, locking, locking_options: lockingOptions, limit, limit_expr: limitExpr });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Find = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Find();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Find(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
