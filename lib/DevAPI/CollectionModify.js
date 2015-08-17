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

CollectionModify.prototype.set = function () {

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
    fields.forEach(function (field, offset) {
        var expression = parse(field);
        if (!expression.identifier) {
            throw new Error("Field expression has to be identifier while parsing " + field + " at offset " + offset);
        }
        var operation = {
            source: expression.identifier,
            operation: Protocol.updateOperations.ITEM_REMOVE
        };

        self._operations.push(operation);
    });
    return this;
};

CollectionModify.prototype.merge = function () {
    throw new Error("modify.merge currently not implemented");
};

CollectionModify.prototype.arrayInsert = function () {
    throw new Error("modify.arrayInsert currently not implemented");
};

CollectionModify.prototype.arrayAppend = function () {
    throw new Error("modify.arrayAppend currently not implemented");
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
