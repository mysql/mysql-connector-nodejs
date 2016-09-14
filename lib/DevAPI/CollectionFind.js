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

const Client = require('../Protocol/Client'),
    Result = require('./Result');

/**
 * A callback for a single document
 *
 * This will be called for each document received from a Collection
 *
 * @callback documentCallback The document as stored in the database
 * @param {object} object
 */

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {String} [query]
 * @constructor
 */
function CollectionFind(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._limit = undefined;
    this._bounds = [];
    this._projection = [];
}

module.exports = CollectionFind;

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionFind}
 */
CollectionFind.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

CollectionFind.prototype.fields = function (fields) {
    if (!Array.isArray(fields)) {
        throw new Error("Argument to fields() must be an array of field selectors");
    }
    this._projection = fields;
    return this;
};

CollectionFind.prototype.bind = function (bind) {
    this._bounds.push(bind);
    return this;
};

/**
 * Execute find operation
 * @param {documentCallback} [rowcb]
 * @return {Promise.<Result>}
 */
CollectionFind.prototype.execute = function (rowcb) {
    var cb = null;
    if (rowcb) {
        cb = function (row) {
            rowcb(row[0]);
        };
    }
    const joins = [];
    return this
        ._session
        ._client
        .crudFind(this._session, this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, this._projection, this._query, null, null, null, this._limit, cb).then(state => new Result(state), {}, joins);
};
