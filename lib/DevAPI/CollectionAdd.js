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

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {object} document
 * @constructor
 */
function CollectionAdd(session, schema, collection, document) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._document = document;
}

module.exports = CollectionAdd;

/**
 *
 * @returns {Promise.<bool>}
 */
CollectionAdd.prototype.execute = function () {
    var documents = this._document;
    documents.forEach(function (doc) {
        if (!doc._id) {
            // TODO - Use a proper ID generator!
            doc._id = Math.floor(Math.random() * 500000) + '-' + Math.floor(Math.random() * 500000);
        }
    });
    return this._session._protocol.crudInsert(this._schema.getName(), this._collection, documents);
};
