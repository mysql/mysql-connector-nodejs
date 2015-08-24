/*
 * Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved.
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

var Protocol = require('../Protocol');
var parse = require('../Expressions').parse;

/**
 *
 * @param {Session} session
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
    var fieldExpression = parse(field);
    if (!fieldExpression.identifier) {
        throw new Error("Field expression has to be identifier while parsing " + field);
    }
    var operation = {
        source: expression.identifier,
        operation: op
    };

    if (expression) {
        operation.value = parse(expression);
    }
}

/**
 * Set a field in the document
 * @param {String} field Field descriptor
 * @param {String} expression Replacement expression
 * @returns {CollectionModify}
 */
CollectionModify.prototype.set = function (field, expression) {
    this._operations.push(getOperation(Protocol.updateOperations.ITEM_SET, field, expression));
    return this;
};

/**
 * Unset fields from document
 *
 * @param {Array.<String>|String} fields
 * @returns {CollectionModify}
 */
CollectionModify.prototype.unset = function (fields) {
    var self = this;

    if (typeof fields === "string") {
        fields = [ fields ];
    }
    fields.forEach(function (field) {
        self._operations.push(getOperation(Protocol.updateOperations.ITEM_REMOVE, field));
    });
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
    this._operations.push(getOperation(Protocol.updateOperations.ARRAY_INSERT, field, expression));
    return this;
};

/**
 * Append an element to an array
 * @param {String} field
 * @param {String} expression
 * @returns {CollectionModify}
 */
CollectionModify.prototype.arrayAppend = function (field, expression) {
    this._operations.push(getOperation(Protocol.updateOperations.ARRAY_APPEND, field, expression));
    return this;
};

CollectionModify.prototype.arrayDelete = function () {
    throw new Error("modify.arrayDelete currently not implemented");
};

/**
 * Execute find operation
 * @param {documentCallback} [rowcb]
 */
CollectionModify.prototype.execute = function () {
    return this
        ._session
        ._protocol
        .crudModify(this._session, this._schema.getName(), this._collection, this._query, this._operations);
};
