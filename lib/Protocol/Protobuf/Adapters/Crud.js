/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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

/**
 * Crud protobuf adapter.
 * @private
 * @module Crud
 */

const Crud = require('../Stubs/mysqlx_crud_pb');
const Datatypes = require('./Datatypes');
const Expr = require('./Expr');
const ExtensionFieldInfo = require('google-protobuf').ExtensionFieldInfo;
const Parser = require('../../../ExprParser');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Additional parser options.
 * @private
 * @typedef {Object} ParserOptions
 * @prop {number} [mode] - the parsing mode (DOCUMENT or TABLE)
 */

/**
 * Prepared statement options.
 * @private
 * @typedef {ParserOptions} PreparedStatementOptions
 * @prop {boolean} [appendArgs] - determines if placeholder assignments should be appended to the message
 * @prop {boolean} [useLimitExpr] - determines if limit expressions should be used
 */

/**
 * Create common Mysqlx.Crud message structure.
 * @private
 * @param {Query} query - database operation instance
 * @paramm {PreparedStatementOptions}
 * @returns {proto.Mysqlx.Crud.Insert|proto.Mysqlx.Crud.Find|proto.Mysqlx.Crud.Update|proto.Mysqlx.Crud.Delete}
 */
exports.create = function (query, options) {
    options = Object.assign({}, options);

    const Builder = Crud[options.builder];
    const proto = new Builder();

    proto.setCollection(this.createCollection(query));
    proto.setDataModel(query.getCategory());

    if (!query.hasBaseCriteria()) {
        const expr = query.getCriteriaExpr() || Expr.createExpr(query.getCriteria(), options);
        query.setCriteriaExpr(expr);
        proto.setCriteria(expr);

        if (options.appendArgs) {
            proto.setArgsList(this.createOperationArgs(query, options));
        }
    }

    if (!options.useLimitExpr) {
        proto.setLimit(this.createLimit(query));
    } else {
        proto.setLimitExpr(this.createLimitExpr(query, { start: Object.keys(query.getBindings()).length }));
    }

    proto.setOrderList(query.getOrderings().map(ordering => this.createOrder(ordering, options)));

    return proto;
};

/**
 * Create a Mysqlx.Crud.Collection protobuf type.
 * @function
 * @name module:Crud#createCollection
 * @param {Query} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Collection} The protobuf object version.
 */
exports.createCollection = function (query) {
    const collection = new Crud.Collection();
    collection.setSchema(query.getSchema().getName());
    collection.setName(query.getTableName());

    return collection;
};

/**
 * Create a Mysqlx.Crud.Column type.
 * @function
 * @name module:Crud#createColumn
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Column} The protobuf object version.
 */
exports.createColumn = function (str, options) {
    // TODO(Rui): check how to use "alias".
    const id = Expr.createColumnIdentifier(str, options);

    const column = new Crud.Column();
    column.setName(id.getName());

    id.getDocumentPathList().forEach(documentPathItem => {
        column.addDocumentPath(documentPathItem);
    });

    return column;
};

/**
 * Create a Mysqlx.Crud.Delete protobuf message.
 * @function
 * @name module:Crud#createDelete
 * @param {module:CollectionRemove|module:TableDelete} query - database operation instance
 * @param {PreparedStatementOptions} [options]
 * @returns {proto.Mysqlx.Crud.Delete} The protobuf message instance.
 */
exports.createDelete = function (query, options) {
    return this.create(query, Object.assign({ appendArgs: true, builder: 'Delete', mode: query.getCategory(), useLimitExpr: false }, options));
};

/**
 * Create a Mysqlx.Crud.Find protobuf message.
 * @function
 * @name module:Crud#createFind
 * @param {module:CollectionFind|module:TableSelect} query - database operation instance
 * @param {PreparedStatementOptions} [options]
 * @returns {proto.Mysqlx.Crud.Find} The protobuf message instance.
 */
exports.createFind = function (query, options) {
    options = Object.assign({ appendArgs: true, builder: 'Find', mode: query.getCategory(), useLimitExpr: false }, options);

    const proto = this.create(query, options);

    proto.setProjectionList(query.getProjections().map(projection => this.createProjection(projection, options)));
    proto.setGroupingList(query.getGroupings().map(grouping => Expr.createExpr(grouping, options)));

    if (!query.hasBaseGroupingCriteria()) {
        proto.setGroupingCriteria(Expr.createExpr(query.getGroupingCriteria(), options));
    }

    proto.setLocking(query.getRowLock());
    proto.setLockingOptions(query.getLockContention());

    return proto;
};

/**
 * Create a Mysqlx.Crud.LimitExpr protobuf type.
 * @function
 * @name module:Crud#createLimitExpr
 * @param {Limiting} query - database operation instance
 * @param {Object} [options] - additional encoding options
 * @returns {proto.Mysqlx.Crud.LimitExpr} The protobuf object version.
 */
exports.createLimitExpr = function (query, options) {
    options = Object.assign({ start: 0 }, options);

    const expr = new Crud.LimitExpr();

    if (typeof query.getCount() !== 'undefined') {
        expr.setRowCount(Expr.createPlaceholder(options.start));
    }

    if (typeof query.getOffset() !== 'undefined') {
        expr.setOffset(Expr.createPlaceholder(options.start + 1));
    }

    return expr;
};

/**
 * Create a Mysqlx.Crud.Limit protobuf type.
 * @function
 * @name module:Crud#createLimit
 * @param {Limiting} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Limit} The protobuf object version.
 */
exports.createLimit = function (query) {
    const count = query.getCount();
    const offset = query.getOffset();

    if (!count && !offset) {
        return;
    }

    const limit = new Crud.Limit();

    if (count) {
        limit.setRowCount(count);
    }

    if (offset) {
        limit.setOffset(offset);
    }

    return limit;
};

/**
 * Create the list of Mysqlx.Datatypes.Any prepared statement arguments.
 * @function
 * @name module:Crud#createPreparedStatementArgs
 * @param {Query} query - database operation instance
 * @returns {Array.<proto.Mysqlx.Datatypes.Any>}
 */
exports.createPreparedStatementArgs = function (query) {
    const args = this.createOperationArgs(query);

    const rowCount = query.getCount();
    const offset = query.getOffset();

    if (typeof rowCount !== 'undefined') {
        args.push(rowCount);
    }

    if (typeof offset !== 'undefined') {
        args.push(offset);
    }

    return args.map(arg => Datatypes.createAny(arg));
};

/**
 * Create the list of Mysqlx.Datatypes.Scalar operation argument protobuf types.
 * @function
 * @name module:Crud#createOperationArgs
 * @param {Query} query - database operation instance
 * @returns {Array.<proto.Mysqlx.Datatypes.Scalar>} The list of protobuf objects.
 */
exports.createOperationArgs = function (query, options) {
    const expr = query.getCriteriaExpr() || Expr.createExpr(query.getCriteria(), options);

    const placeholders = expr.getExtension(new ExtensionFieldInfo(Expr.Type.PLACEHOLDER));
    const bindings = query.getBindings();

    return placeholders.reduce((res, placeholder) => {
        const value = bindings[placeholder];

        if (Expr.isValid(value) && typeof value.getLiteral === 'function') {
            return res.concat(value.getLiteral());
        }

        return res.concat(Datatypes.createScalar(value));
    }, []);
};

/**
 * Create a Mysqlx.Crud.Order protobuf type.
 * @function
 * @name module:Crud#createOrder
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Order} The protobuf object version.
 */
exports.createOrder = function (str, options) {
    options = Object.assign({ type: Parser.Type.SORT_EXPR }, options);

    return Parser.parse(str, options).output;
};

/**
 * Create a Mysqlx.Crud.Projection protobuf type.
 * @function
 * @name module:Crud#createProjection
 * @param {string|Mysqlx.Expr.Expr} str - expression
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Projection} The protobuf object version.
 */
exports.createProjection = function (expr, options) {
    options = Object.assign({ type: Parser.Type.PROJECTED_SEARCH_EXPR }, options);

    if (Expr.isValid(expr)) {
        const projection = new Crud.Projection();
        projection.setSource(expr);

        return projection;
    }

    return Parser.parse(expr, options).output;
};

/**
 * Create a Mysqlx.Crud.Insert.TypedRow protobuf type.
 * @param {Object|Array} row - document or table row
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Insert.TypedRow} The protobuf object version.
 */
exports.createTypedRow = function (row, options) {
    options = Object.assign({ parse: false }, options);

    const values = Array.isArray(row) ? row : Array.of(row);
    const typedRow = new Crud.Insert.TypedRow();

    values.forEach(value => {
        // Checks of value is already a Mysqlx.Expr.Expr
        if (Expr.isValid(value)) {
            return typedRow.addField(value);
        }

        typedRow.addField(Expr.createExpr(value, options));
    });

    return typedRow;
};

/**
 * Create a Mysqlx.Crud.Update protobuf type.
 * @function
 * @name module:Crud#createUpdate
 * @param {query} operation - operation object
 * @param {PreparedStatementOptions} [options]
 * @returns {proto.Mysqlx.Crud.Update} The protobuf object version.
 */
exports.createUpdate = function (query, options) {
    options = Object.assign({ appendArgs: true, builder: 'Update', mode: query.getCategory(), useLimitExpr: false }, options);

    const proto = this.create(query, options);
    proto.setOperationList(query.getOperations().map(operation => this.createUpdateOperation(operation, options)));

    return proto;
};

/**
 * Operation object.
 * @private
 * @typedef {Object} Operation
 * @prop {number} type - operation type
 * @prop {string} source - column name
 * @prop {string} [value] - new value
 */

/**
 * Create a Mysqlx.Crud.UpdateOperation protobuf type.
 * @function
 * @name module:Crud#createUpdateOperation
 * @param {Operation} operation - operation object
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.UpdateOperation} The protobuf object version.
 */
exports.createUpdateOperation = function (operation, options) {
    options = Object.assign({ parse: false }, options);

    const updateOperation = new Crud.UpdateOperation();
    const source = Expr.createColumnIdentifier(operation.source, options);
    updateOperation.setSource(source);
    updateOperation.setOperation(operation.type);

    // ITEM_REMOVE operations should not contain any value
    if (operation.type === Crud.UpdateOperation.UpdateType.ITEM_REMOVE) {
        return updateOperation;
    }

    if (Expr.isValid(operation.value)) {
        updateOperation.setValue(operation.value);

        return updateOperation;
    }

    updateOperation.setValue(Expr.createExpr(operation.value, options));

    return updateOperation;
};

/**
 * Encode a Mysqlx.Crud.Delete protobuf message.
 * @function
 * @name module:Crud#encodeDelete
 * @param {module:CollectionRemove|module:TableDelete} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeDelete = function (query) {
    const proto = this.createDelete(query);

    debug('Mysqlx.Crud.Delete', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Crud.Find protobuf message.
 * @function
 * @name module:Crud#encodeFind
 * @param {module:CollectionFind|module:TableSelect} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeFind = function (query) {
    const message = this.createFind(query);

    debug('Mysqlx.Crud.Find', JSON.stringify(message.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(message.serializeBinary());
};

/**
 * Encode a Mysqlx.Crud.Insert protobuf message.
 * @function
 * @name module:Crud#encodeInsert
 * @param {module:CollectionAdd|module:TableInsert} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeInsert = function (query) {
    const options = { mode: query.getCategory() };
    const message = new Crud.Insert();

    message.setCollection(this.createCollection(query));
    message.setDataModel(query.getCategory());

    query.getColumns().forEach(column => {
        message.addProjection(this.createColumn(column, options));
    });

    query.getItems().forEach(row => {
        message.addRow(this.createTypedRow(row), options);
    });

    message.setUpsert(query.isUpsert());

    debug('Mysqlx.Crud.Insert', JSON.stringify(message.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(message.serializeBinary());
};

/**
 * Encode a Mysqlx.Crud.Update protobuf message.
 * @function
 * @name module:Crud#encodeUpdate
 * @param {module:CollectionModify|module:TableUpdate} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Update} The protobuf encoded object.
 */
exports.encodeUpdate = function (query) {
    const message = this.createUpdate(query);

    debug('Mysqlx.Crud.Update', JSON.stringify(message.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(message.serializeBinary());
};
