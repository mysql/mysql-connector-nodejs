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

// TODO: Lots of duplication with CollectionFind ....

const Client = require('../Protocol/Client'),
    Result = require('./Result');

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {String} [query]
 * @constructor
 */
function CollectionRemove(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._limit = null;
    this._bounds = {};
}

module.exports = CollectionRemove;

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionRemove}
 */
CollectionRemove.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

CollectionRemove.prototype.bind = function (bind) {
    Object.assign(this._bounds, bind);
    return this;
};

/**
 * Execute remove operation
 */
CollectionRemove.prototype.execute = function () {
    return this
        ._session
        ._client
        .crudRemove(this._session, this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, this._query, this._limit).then(state => new Result(state), this._bounds);
};
