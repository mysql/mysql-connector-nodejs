/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
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

const util = require('util'),
    DatabaseObject = require('./DatabaseObject'),
    CollectionFind = require('./CollectionFind'),
    CollectionAdd = require('./CollectionAdd'),
    CollectionModify = require('./CollectionModify'),
    CollectionRemove = require('./CollectionRemove'),
    Table = require('./Table');

/**
 * Collection object
 *
 * Usually you shouldn't create an instance of this but ask a Schema for it
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {String} collection
 * @constructor
 * @extends DatabaseObject
 */
function Collection(session, schema, collection) {
    DatabaseObject.call(this, session, schema);
    this._collection = collection;
}

module.exports = Collection;

util.inherits(Collection, DatabaseObject);

/**
 * Get the name of this collection
 * @returns {string}
 */
Collection.prototype.getName = function () {
    return this._collection;
};

/**
 * Verifies this collection exists
 * @returns {Promise<boolean>}
 */
Collection.prototype.existsInDatabase = function () {
    var args = [
        this._schema.getName(),
        this._collection
    ];

    var found = false;

    return this._session._client.sqlStmtExecute("list_objects", args, function () { found = true; }, null, "xplugin").then(function () {
        return found;
    });
};

/**
 * Find documents from a collection
 * @param {String} expr Expression
 * @returns {CollectionFind}
 */
Collection.prototype.find = function (expr) {
    return new CollectionFind(this._session, this._schema, this._collection, expr);
};

/**
 * Add one or more documents
 *
 * Multiple documents can be provided as array or by using multiple arguments
 *
 * @param {...object|Array} document
 * @returns {CollectionAdd}
 */
Collection.prototype.add = function (document) {
    var documents = (arguments.length === 1 && Array.isArray(document)) ?
        document : Array.prototype.slice.call(arguments);

    return new CollectionAdd(this._session, this._schema, this._collection, documents);
};

/**
 * Run modify operations
 * @param {String} expr Expression
 * @returns {CollectionModify}
 */
Collection.prototype.modify = function (expr) {
    return new CollectionModify(this._session, this._schema, this._collection, expr);
};

/**
 * Remove documents from a collection
 * @param {String} expr Expression
 * @returns {CollectionRemove}
 */
Collection.prototype.remove = function (expr) {
    return new CollectionRemove(this._session, this._schema, this._collection, expr);
};

/**
 * Drop this collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @returns {Promise.<bool>}
 */
Collection.prototype.drop = function () {
    var args = [
        this._schema.getName(),
        this._collection
    ];
    return this._session._client.sqlStmtExecute("drop_collection", args, null, null, "xplugin").then(function () {
        return true;
    });
};

/**
 * Get number of documents in this Collection
 *
 * @returns {Promise.<Number>}
 */
Collection.prototype.count = function () {
    const schema = Table.escapeIdentifier(this._schema.getName()),
        table = Table.escapeIdentifier(this._table);
    let count = 0;

    return this._session._client.sqlStmtExecute("SELECT COUNT(*) FROM " + schema + "." + table, [], row => { count = row[0]; }).then(function () {
        return count;
    });
};

Collection.prototype.inspect = function () {
    return { schema: this._schema.getName(), collection: this._collection };
};
