/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
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
 * Encode a Mysqlx.Crud.Column type.
 * @function
 * @name module:Crud#encodeColumn
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Column} The protobuf encoded object.
 */
exports.encodeColumn = function (str, options) {
    // TODO(Rui): check how to use "alias".
    const id = Expr.encodeColumnIdentifier(str, options);

    const column = new Crud.Column();
    column.setName(id.getName());

    id.getDocumentPathList().forEach(documentPathItem => {
        column.addDocumentPath(documentPathItem);
    });

    return column;
};

/**
 * Encode a Mysqlx.Crud.Collection protobuf type.
 * @function
 * @name module:Crud#encodeCollection
 * @param {Query} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Collection} The protobuf encoded object.
 */
exports.encodeCollection = function (query) {
    const collection = new Crud.Collection();
    collection.setSchema(query.getSchema().getName());
    collection.setName(query.getTableName());

    return collection;
};

/**
 * Encode a Mysqlx.Crud.Delete protobuf message.
 * @function
 * @name module:Crud#encodeDelete
 * @param {module:CollectionRemove|module:TableDelete} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeDelete = function (query) {
    const options = { mode: query.getCategory() };
    const message = new Crud.Delete();

    message.setCollection(this.encodeCollection(query));
    message.setDataModel(query.getCategory());

    if (!query.hasBaseCriteria()) {
        const expr = Expr.encodeExpr(query.getCriteria(), options);
        message.setCriteria(expr);

        const extension = new ExtensionFieldInfo(Expr.Type.PLACEHOLDER);
        const placeholders = expr.getExtension(extension);
        const bindings = query.getBindings();

        placeholders.forEach(placeholder => {
            const value = bindings[placeholder];

            if (!value) {
                return;
            }

            if (Expr.isValid(value) && typeof value.getLiteral === 'function') {
                return message.addArgs(value.getLiteral());
            }

            message.addArgs(Datatypes.encodeScalar(value));
        });
    }

    message.setLimit(this.encodeLimit(query));

    query.getOrderings().forEach(ordering => {
        message.addOrder(this.encodeOrder(ordering, options));
    });

    debug('Mysqlx.Crud.Delete', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};

/**
 * Encode a Mysqlx.Crud.Find protobuf message.
 * @function
 * @name module:Crud#encodeFind
 * @param {module:CollectionFind|module:TableSelect} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeFind = function (query) {
    const options = { mode: query.getCategory() };
    const message = new Crud.Find();

    message.setCollection(this.encodeCollection(query));
    message.setDataModel(query.getCategory());

    if (!query.hasBaseCriteria()) {
        const expr = Expr.encodeExpr(query.getCriteria(), options);
        message.setCriteria(expr);

        const extension = new ExtensionFieldInfo(Expr.Type.PLACEHOLDER);
        const placeholders = expr.getExtension(extension);
        const bindings = query.getBindings();

        placeholders.forEach(placeholder => {
            const value = bindings[placeholder];

            if (!value) {
                return;
            }

            if (Expr.isValid(value) && typeof value.getLiteral === 'function') {
                return message.addArgs(value.getLiteral());
            }

            message.addArgs(Datatypes.encodeScalar(value));
        });
    }

    query.getProjections().forEach(expr => {
        message.addProjection(this.encodeProjection(expr, options));
    });

    message.setLimit(this.encodeLimit(query));

    query.getOrderings().forEach(ordering => {
        message.addOrder(this.encodeOrder(ordering, options));
    });

    query.getGroupings().forEach(grouping => {
        message.addGrouping(Expr.encodeExpr(grouping, options));
    });

    if (!query.hasBaseGroupingCriteria()) {
        message.setGroupingCriteria(Expr.encodeExpr(query.getGroupingCriteria(), options));
    }

    message.setLocking(query.getRowLock());
    message.setLockingOptions(query.getLockContention());

    debug('Mysqlx.Crud.Find', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
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

    message.setCollection(this.encodeCollection(query));
    message.setDataModel(query.getCategory());

    query.getColumns().forEach(column => {
        message.addProjection(this.encodeColumn(column, options));
    });

    query.getItems().forEach(row => {
        message.addRow(this.encodeTypedRow(row), options);
    });

    message.setUpsert(query.isUpsert());

    debug('Mysqlx.Crud.Insert', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};

/**
 * Encode a Mysqlx.Crud.Limit protobuf type.
 * @function
 * @name module:Crud#encodeLimit
 * @param {Limiting} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Limit} The protobuf encoded object.
 */
exports.encodeLimit = function (query) {
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
 * Encode a Mysqlx.Crud.Order protobuf type.
 * @function
 * @name module:Crud#encodeOrder
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Order} The protobuf encoded object.
 */
exports.encodeOrder = function (str, options) {
    options = Object.assign({ type: Parser.Type.SORT_EXPR }, options);

    return Parser.parse(str, options).output;
};

/**
 * Encode a Mysqlx.Crud.Projection protobuf type.
 * @function
 * @name module:Crud#encodeProjection
 * @param {string|Mysqlx.Expr.Expr} str - expression
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Projection} The protobuf encoded object.
 */
exports.encodeProjection = function (expr, options) {
    options = Object.assign({ type: Parser.Type.PROJECTED_SEARCH_EXPR }, options);

    if (Expr.isValid(expr)) {
        const projection = new Crud.Projection();
        projection.setSource(expr);

        return projection;
    }

    return Parser.parse(expr, options).output;
};

/**
 * Encode a Mysqlx.Crud.Insert.TypedRow protobuf type.
 * @param {Object|Array} row - document or table row
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Crud.Insert.TypedRow} The protobuf encoded object.
 */
exports.encodeTypedRow = function (row, options) {
    options = Object.assign({ parse: false }, options);

    const values = Array.isArray(row) ? row : Array.of(row);
    const typedRow = new Crud.Insert.TypedRow();

    values.forEach(value => {
        if (!value) {
            return;
        }

        // Checks of value is already a Mysqlx.Expr.Expr
        if (Expr.isValid(value)) {
            return typedRow.addField(value);
        }

        typedRow.addField(Expr.encodeExpr(value, options));
    });

    return typedRow;
};

/**
 * Encode a Mysqlx.Crud.Update protobuf message.
 * @function
 * @name module:Crud#encodeUpdate
 * @param {module:CollectionModify|module:TableUpdate} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Update} The protobuf encoded object.
 */
exports.encodeUpdate = function (query) {
    const options = { mode: query.getCategory() };
    const message = new Crud.Update();

    message.setCollection(this.encodeCollection(query));
    message.setDataModel(query.getCategory());

    if (!query.hasBaseCriteria()) {
        const expr = Expr.encodeExpr(query.getCriteria(), options);
        message.setCriteria(expr);

        const extension = new ExtensionFieldInfo(Expr.Type.PLACEHOLDER);
        const placeholders = expr.getExtension(extension);
        const bindings = query.getBindings();

        placeholders.forEach(placeholder => {
            const value = bindings[placeholder];

            if (!value) {
                return;
            }

            if (Expr.isValid(value) && typeof value.getLiteral === 'function') {
                return message.addArgs(value.getLiteral());
            }

            message.addArgs(Datatypes.encodeScalar(value));
        });
    }

    message.setLimit(this.encodeLimit(query));

    query.getOrderings().forEach(ordering => {
        message.addOrder(this.encodeOrder(ordering, options));
    });

    query.getOperations().forEach(operation => {
        message.addOperation(this.encodeUpdateOperation(operation, options));
    });

    debug('Mysqlx.Crud.Update', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
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
 * Encode a Mysqlx.Crud.UpdateOperation protobuf type.
 * @function
 * @name module:Crud#encodeUpdateOperation
 * @param {Operation} operation - operation object
 * @param {ParserOptions} [options] - additional options
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeUpdateOperation = function (operation, options) {
    options = Object.assign({ parse: false }, options);

    const updateOperation = new Crud.UpdateOperation();
    const source = Expr.encodeColumnIdentifier(operation.source, options);
    updateOperation.setSource(source);
    updateOperation.setOperation(operation.type);

    if (!operation.value) {
        return updateOperation;
    }

    if (Expr.isValid(operation.value)) {
        updateOperation.setValue(operation.value);

        return updateOperation;
    }

    updateOperation.setValue(Expr.encodeExpr(operation.value, options));

    return updateOperation;
};
