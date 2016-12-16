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
const Expressions = require('../Expressions');
const Result = require('./Result');
const util = require('util');

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Table} table
 * @constructor
 */
function TableUpdate (session, schema, table) {
    BaseQuery.call(this);

    this._session = session;
    this._schema = schema;
    this._table = table;
    this._operations = [];
    this._query = '';
    this._bounds = {};
}

util.inherits(TableUpdate, BaseQuery);

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

TableUpdate.prototype.bind = function (bind) {
    Object.assign(this._bounds, bind);
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
        .crudModify(this._schema.getName(), this._table, Client.dataModel.TABLE, this._query, this._operations, this._limit, this._bounds)
        .then(state => new Result(state));
};
