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
 * @param {Table} table
 * @constructor
 */
function TableUpdate(session, schema, table) {
    this._session = session;
    this._schema = schema;
    this._table = table;
    this._operations = [];
    this._query = "";
    this._limit = undefined;
}

module.exports = TableUpdate;


/**
 * Add a field to be updated
 * @param {string} field Name of the field
 * @param {string} expr Expression
 * @returns {TableUpdate} Returns itself
 */
TableUpdate.prototype.set = function (field, expr) {
    expr = Expressions.literalOrParsedExpression(expr);
    this._operations.push({
        operation: 1,
        source: {
            name: field
        },
        value: expr
    });
    return this;
};

/**
 * Add where clause
 * @param {String} query Query Expression
 * @returns {TableUpdate} returns itself
 */
TableUpdate.prototype.where = function (query) {
    this._query = query;
    return this;
};

/**
 * Add limit
 * @param {number} limit
 * @returns {TableDelete} Returns itself
 */
TableUpdate.prototype.limit = function (limit) {
    if (!this._limit) {
        this._limit = {};
    }
    this._limit.count = limit;
    return this;
};

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionFind}
 */
TableUpdate.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

/**
 * Execute update operation
 * @return {Promise.<Result>}
 */
TableUpdate.prototype.execute = function () {
    return this
        ._session
        ._client
        .crudModify(this._schema.getName(), this._table, Client.dataModel.TABLE, this._query, this._operations, this._limit)
        .then(state => new Result(state));
};
