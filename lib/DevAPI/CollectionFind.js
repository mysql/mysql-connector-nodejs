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

'use strict';

const BaseQuery = require('./BaseQuery');
const Client = require('../Protocol/Client');
const Result = require('./Result');
const util = require('util');

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
 * @augments BaseQuery
 */
function CollectionFind (session, schema, collection, query) {
    BaseQuery.call(this);

    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._bounds = {};
    this._projection = [];
}

util.inherits(CollectionFind, BaseQuery);

module.exports = CollectionFind;

CollectionFind.prototype.fields = function (fields) {
    if (!Array.isArray(fields)) {
        throw new Error('Argument to fields() must be an array of field selectors');
    }

    this._projection = fields;

    return this;
};

/**
 * Bind values to query parameters.
 * @param {string|Object} parameter - parameter name or mapping object
 * @param {string} [value]
 * @example
 * // parameter name and value as arguments
 * const query = collection.find('$.foo == :foo').bind('foo', 'bar')
 *
 * // parameter name and value as key-value pair in an object
 * const query = collection.find('$.foo == :foo').bind({ foo: 'bar' })
 * @returns {TableSelect}
 */
CollectionFind.prototype.bind = function () {
    if (!arguments.length) {
        return this;
    }

    let bound;

    if (Object(arguments[0]) === arguments[0]) {
        bound = arguments[0];
    } else {
        bound = { [arguments[0]]: arguments[1] };
    }

    this._bounds = Object.assign(this._bounds, bound);

    return this;
};

/**
 * Execute find operation
 * @param {documentCallback} [rowcb]
 * @return {Promise.<Result>}
 */
CollectionFind.prototype.execute = function (rowcb) {
    let cb;

    if (rowcb) {
        cb = function (row) {
            rowcb(row[0]);
        };
    }

    const joins = [];

    return this
        ._session
        ._client
        .crudFind(this._session, this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, this._projection, this._query, null, null, null, this._limit, cb, null, this._bounds, joins)
        .then(state => new Result(state));
};
