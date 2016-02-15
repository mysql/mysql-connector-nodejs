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

var util = require('util'),
    Collection = require('./Collection'),
    Table = require('./Table'),
    DatabaseObject = require('./DatabaseObject');

/**
 * Access to Schema-related operations
 *
 * Usually you shouldn't create this yourself but via session object
 *
 * @param {BaseSession} session
 * @param {string} schema Name of the schema
 * @constructor
 * @extends DatabaseObject
 */
function Schema(session, schema) {
    DatabaseObject.call(this, session, schema);
}

module.exports = Schema;

util.inherits(Schema, DatabaseObject);

/**
 * Get the name of this schema
 * @returns {string}
 */
Schema.prototype.getName = function () {
    return this._schema;
};

/**
 * Verifies this schema exists
 *
 * @returns {Promise<boolean>}
 */
Schema.prototype.existsInDatabase = function () {
    var args = [
        this._schema
    ];

    var found = false;

    return this._session._client.sqlStmtExecute("SHOW DATABASES LIKE ?", args, function () { found = true; }).then(function () {
        return found;
    });
};

Schema.prototype.listObjects = function (type, factory) {
    const args = [
        this._schema
    ];

    const result = {};
    return this._session._client.sqlStmtExecute("list_objects", args, row => {
        if (row[1] === type) {
            result[row[0]] = factory.call(this, row[0]);
        }
    }, null, "xplugin").then(function () {
        return result;
    });
};

/**
 * Get collections
 *
 * @returns {Promise.<CollectionList>} Promise resolving to an object of Collection name <-> Collection object pairs
 */
Schema.prototype.getCollections = function () {
    return this.listObjects("COLLECTION", this.getCollection);
};

/**
 * Get a Collection object
 *
 * This will always succeed
 *
 * @param {string} collection Name of the collection
 * @returns {Collection}
 */
Schema.prototype.getCollection = function (collection) {
    return new Collection(this._session, this, collection);
};

/**
 * Create a new collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} collection Name of the collection
 * @returns {Promise.<Collection>}
 */
Schema.prototype.createCollection = function (collection) {
    const args = [
        this._schema,
        collection
    ];
    return this._session._client.sqlStmtExecute("create_collection", args, null, null, "xplugin")
        .then(() => this.getCollection(collection));
};

/**
 * Drop this collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} collection Name of collection to drop
 * @returns {Promise.<bool>}
 */
Schema.prototype.dropCollection = function (collection) {
    return this.getCollection(collection).drop();
};

/**
 * Get tables
 *
 * @returns {Promise.<TableList>} Promise resolving to an object of Table name <-> Table object pairs
 */
Schema.prototype.getTables = function () {
    return this.listObjects("TABLE", this.getTable);
};
/**
 * Get a Table object
 *
 * This will always succeed
 *
 * @param {string} table Name of the table
 * @returns {Table}
 */
Schema.prototype.getTable = function (table) {
    return new Table(this._session, this, table);
};

/**
 * Drop a table
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} table Name of table to drop
 * @returns {Promise.<bool>}
 */
Schema.prototype.dropTable = function (table) {
    return this.getTable(table).drop();
};
