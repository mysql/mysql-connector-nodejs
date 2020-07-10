/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const DeleteStub = require('../../../Stubs/mysqlx_crud_pb').Delete;
const collection = require('./Collection');
const expr = require('../Expr/Expr');
const limit = require('./Limit');
const limitExpr = require('./LimitExpr');
const list = require('../../Traits/List');
const order = require('./Order');
const polyglot = require('../../Traits/Polyglot');
const scalar = require('../Datatypes/Scalar');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Delete
 * @param {proto.Mysqlx.Crud.Delete} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Delete}
 */
function Delete (proto) {
    return Object.assign({}, polyglot(proto), serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Delete#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                collection: collection(proto.getCollection()).toJSON(),
                data_model: this.getDataModel(),
                criteria: expr(proto.getCriteria()).toJSON(),
                args: list(proto.getArgsList().map(arg => scalar(arg))).toJSON(),
                order: list(proto.getOrderList().map(rule => order(rule))).toJSON(),
                limit: limit(proto.getLimit()).toJSON(),
                limit_expr: limitExpr(proto.getLimitExpr()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Crud.Delete instance for a given statement.
 * @param {module:CollectionRemove|module:TableDelete} statement
 * @param {Object} [options] - extended options
 * @returns {module:adapters.Mysqlx.Crud.Delete}
 */
Delete.create = function (statement, options) {
    options = Object.assign({}, { mode: statement.getCategory(), toParse: true, toPrepare: false }, options);

    const proto = new DeleteStub();

    proto.setCollection(collection.create(statement.getTableName(), statement.getSchema()).valueOf());
    proto.setDataModel(statement.getCategory());

    const criteria = expr.create(statement.getCriteria(), options);
    proto.setCriteria(criteria.valueOf());

    const args = criteria.getPlaceholderArgs(statement.getBindings());

    // Placeholder assignments can't be encoded in the Prepare stage
    if (!options.toPrepare) {
        proto.setArgsList(args);
        // non-prepared statements should use Mysqlx.Crud.Limit to keep compatibility with older server versions
        proto.setLimit(limit.create(statement.getCount()).valueOf());
    } else {
        // if row_count and offset should be placeholders, they need to map to the
        // appropriate position index (args.length + i)
        // CollectionRemove and TableDelete operations do not have an offset API
        proto.setLimitExpr(limitExpr.create(statement.getCount(), Object.assign({}, options, { position: args.length })).valueOf());
    }

    proto.setOrderList(statement.getOrderings().map(column => order.create(column, options).valueOf()));

    return Delete(proto);
};

module.exports = Delete;
