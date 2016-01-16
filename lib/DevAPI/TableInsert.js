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

var Client = require('../Protocol/Client');
var Table = require('./Table');

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {String} table name
 * @param {Array<string>} fields
 * @constructor
 */
function TableInsert(session, schema, table, fields) {
    this._session = session;
    this._schema = schema;
    this._table = table;
    this._fields = fields;
    this._rows = [];
}

module.exports = TableInsert;


TableInsert.prototype.values = function () {
    var k, values = [];

    if (this._fields.length !== arguments.length) {
        throw new Error("Mismatch in column count. " + this._fields.length + " fields listed, " + arguments.length + " values provided");
    }

    for (k in arguments) {
        values.push(arguments[k]);
    }
    this._rows.push(values);
    return this;
};

/**
 *
 * @returns {Promise.<bool>}
 */
TableInsert.prototype.execute = function () {
    var projection = this._fields.map(function (field) {
        return { name: field };
    });

    return this._session._client.crudInsert(this._schema.getName(), this._table, Client.dataModel.TABLE, this._rows, projection);
};
