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

const FindStub = require('../../../Stubs/mysqlx_crud_pb').Find;
const collection = require('./Collection');
const expr = require('../Expr/Expr');
const limit = require('./Limit');
const limitExpr = require('./LimitExpr');
const list = require('../../Traits/List');
const order = require('./Order');
const polyglot = require('../../Traits/Polyglot');
const projection = require('./Projection');
const scalar = require('../Datatypes/Scalar');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Find
 * @param {proto.Mysqlx.Crud.Find} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Find}
 */
function Find (proto) {
    return Object.assign({}, polyglot(proto), serializable(proto), wraps(proto), {
        /**
         * Retireve the name of the type of behavior of an associated lock.
         * @function
         * @name module:adapters.Mysqlx.Crud.Find#getLockOptions
         * @returns {string}
         */
        getLockOptions () {
            return Object.keys(FindStub.RowLockOptions)
                .filter(k => FindStub.RowLockOptions[k] === proto.getLockingOptions())[0];
        },

        /**
         * Retireve the name of the type of the associated lock.
         * @function
         * @name module:adapters.Mysqlx.Crud.Find#getLockType
         * @returns {string}
         */
        getLockType () {
            return Object.keys(FindStub.RowLock)
                .filter(k => FindStub.RowLock[k] === proto.getLocking())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Find#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                collection: collection(proto.getCollection()).toJSON(),
                data_model: this.getDataModel(),
                projection: list(proto.getProjectionList().map(column => projection(column))).toJSON(),
                criteria: expr(proto.getCriteria()).toJSON(),
                args: list(proto.getArgsList().map(arg => scalar(arg))).toJSON(),
                order: list(proto.getOrderList().map(rule => order(rule))).toJSON(),
                grouping: list(proto.getGroupingList().map(column => expr(column))).toJSON(),
                grouping_criteria: expr(proto.getGroupingCriteria()).toJSON(),
                locking: this.getLockType(),
                locking_options: this.getLockOptions(),
                limit: limit(proto.getLimit()).toJSON(),
                limit_expr: limitExpr(proto.getLimitExpr()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.Find protobuf message given a
 * statement instance.
 * @private
 * @param {module:CollectionFind|module:TableSelect} statement
 * @param {boolean} [toPrepare] - Determines if the statement is being
 * prepared or executed. Enabled only when creating a wrapper for a
 * Mysqlx.Prepapare.OneOfMessage protobuf message.
 * @returns {module:adapters.Mysqlx.Crud.Find}
 */
Find.create = function (statement, { toPrepare = false } = {}) {
    const proto = new FindStub();

    proto.setCollection(collection.create({ name: statement.getTableName(), schemaName: statement.getSchema().getName() }).valueOf());
    proto.setDataModel(statement.getCategory());
    proto.setProjectionList(statement.getProjectionList_().map(columnOrField => projection.create(columnOrField).valueOf()));

    const placeholders = statement.getPlaceholders_();
    proto.setCriteria(expr.create({ value: statement.getCriteria_(), placeholders }).valueOf());

    // Placeholder values are not assigned when a statement is being prepared.
    if (!toPrepare) {
        const placeholderValues = statement.getPlaceholderValues_();
        // Placeholder values need to be Mysqlx.Datatypes.Scalar protobuf
        // messages. Instead of doing explicit type validation, we simply
        // ignore values that cannot be encoded and rely on the server
        // error message.
        const args = placeholderValues.map(value => scalar.create({ value }).valueOf())
            .filter(value => typeof value !== 'undefined');

        proto.setArgsList(args);
        // non-prepared statements should use Mysqlx.Crud.Limit to keep compatibility with older server versions
        proto.setLimit(limit.create({ count: statement.getCount_(), offset: statement.getOffset_() }).valueOf());
    } else {
        // It should only enter this branch when it is called by OneOfMessage.
        // if row_count and offset should be placeholders, they need to map to the
        // appropriate position index (args.length + i)
        proto.setLimitExpr(limitExpr.create({ count: statement.getCount_(), offset: statement.getOffset_(), position: placeholders.length }).valueOf());
    }

    proto.setOrderList(statement.getOrderList_().map(columnOrField => order.create(columnOrField).valueOf()));
    proto.setGroupingList(statement.getGroupingList_().map(value => expr.create({ value }).valueOf()));
    proto.setGroupingCriteria(expr.create({ value: statement.getGroupingCriteria_() }).valueOf());
    proto.setLocking(statement.getLock_());
    proto.setLockingOptions(statement.getLockOptions_());

    return Find(proto);
};

module.exports = Find;
