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

var Client = require('../Protocol/Client'),
    Column = require('./Column'),
    Result = require('./Result'),
    Expressions = require('../Expressions');


/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Table} table
 * @param {String} projection
 * @constructor
 */
function TableSelect(session, schema, table, projection) {
    this._session = session;
    this._schema = schema;
    this._table = table;
    this._projection = projection;
    this._where = null;
    this._groupby = null;
    this._having = null;
    this._orderby = null;
    this._limit = null;
    this._bounds = [];
}

module.exports = TableSelect;

/**
 * Add where clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.where = function (expr) {
    this._where = expr;
    return this;
};

/**
 * Add Group By clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.groupBy = function (expr) {
    this._groupby = expr;
    return this;
};

/**
 * Add having clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.having = function (expr) {
    this._having = expr;
    return this;
};

/**
 * Add order by claue
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.orderBy = function (expr) {
    this._orderby = expr;
    return this;
};

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {TableSelect}
 */
TableSelect.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

TableSelect.prototype.bind = function (bind) {
    this._bounds.push(bind);
    return this;
};

/**
 * Execute find operation
 * @param {documentCallback} [rowcb]
 * @param {Array<Column>} [metacb]
 * @return {Promise.<Result>}
 */
TableSelect.prototype.execute = function (rowcb, metacb) {
    var projection = this._projection.map(function (field) {
        const splitted = field.split(/\sas\s/i);
        if (splitted.length > 2) {
            throw new Error("Multiple instances of AS");
        }

        return {
            source: {
                type: 1,
                identifier: {
                    name: splitted[0]
                }
            },
            alias: splitted[1]
        };
    });

    return this
        ._session
        ._client
        .crudFind(this._session, this._schema.getName(), this._table, Client.dataModel.TABLE, projection, this._where, this._groupby, this._having,  this._limit, rowcb, Column.metaCB(metacb))
        .then(state => new Result(state));
};
