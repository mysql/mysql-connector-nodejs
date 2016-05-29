/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

"use strict";

const Client = require('../Protocol/Client'),
    Expressions = require('../Expressions'),
    Result = require('./Result');


/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {String} [query]
 * @constructor
 */
function CollectionModify(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._operations = [];
}

module.exports = CollectionModify;

function getOperation(op, field, expression) {
    var fieldExpression = Expressions.parse(field);
    if (!fieldExpression.expr.identifier) {
        throw new Error("Field expression has to be identifier while parsing " + field);
    }
    var operation = {
        source: fieldExpression.expr.identifier,
        operation: op
    };

    if (expression) {
        operation.value = Expressions.literalOrParsedExpression(expression);
    }

    return operation;
}

/**
 * Set a field in the document
 * @param {String} field Field descriptor
 * @param {String} expression Replacement expression
 * @returns {CollectionModify}
 */
CollectionModify.prototype.set = function (field, expression) {
    this._operations.push(getOperation(Client.updateOperations.ITEM_SET, field, expression));
    return this;
};

/**
 * Unset fields from document
 *
 * @param {Array.<String>|String} fields
 * @returns {CollectionModify}
 */
CollectionModify.prototype.unset = function (fields) {
    if (typeof fields === "string") {
        fields = [ fields ];
    }
    fields = fields.map(field => getOperation(Client.updateOperations.ITEM_REMOVE, field));
    this._operations = this._operations.concat(fields);

    return this;
};

CollectionModify.prototype.merge = function () {
    throw new Error("modify.merge currently not implemented");
};

/**
 *
 * @param field
 * @param expression
 * @returns {CollectionModify}
 */
CollectionModify.prototype.arrayInsert = function (field, expression) {
    this._operations.push(getOperation(Client.updateOperations.ARRAY_INSERT, field, expression));
    return this;
};

/**
 * Append an element to an array
 * @param {String} field
 * @param {String} expression
 * @returns {CollectionModify}
 */
CollectionModify.prototype.arrayAppend = function (field, expression) {
    this._operations.push(getOperation(Client.updateOperations.ARRAY_APPEND, field, expression));
    return this;
};

CollectionModify.prototype.arrayDelete = function (field, expression) {
    this._operations.push(getOperation(Client.updateOperations.ITEM_REMOVE, field, expression));
    return this;
};

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionFind}
 */
CollectionModify.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};
/**
 * Execute find operation
 * @return {Promise.<Result>}
 */
CollectionModify.prototype.execute = function () {
    return this
        ._session
        ._client
        .crudModify(this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, this._query, this._operations, this._limit, {})
        .then(state => new Result(state));
};
