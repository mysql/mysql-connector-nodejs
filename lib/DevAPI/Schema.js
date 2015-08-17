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

var Collection = require('./Collection'),
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

Schema.prototype = Object.create(DatabaseObject.prototype);

/**
 * Get the name of ths schema
 * @returns {string}
 */
Schema.prototype.getName = function () {
    return this._schema;
};

/**
 * Get a Collection object
 *
 * This will always suceed
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
    var self = this;
    var args = [
        this._schema,
        collection
    ];
    return this._session._protocol.sqlStmtExecute("create_collection", args, null, null, "xplugin")
        .then(function () {
            return self.getCollection(collection);
        });
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
    return this._session._protocol.sqlStmtExecute("drop_collection", args, null, null, "xplugin");
};
