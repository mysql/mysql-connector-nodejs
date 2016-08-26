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
    Table = require('./Table'),
    Result = require('./Result');

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

/**
 * Set values for a row
 *
 * Individual values have to be provided as arguments or in form of a single array
 *
 * Both ways are shown below:
 *
 * <pre>table.
 *   insert(["col1", "col2"]).
 *   values("row 1, value 1", "row 1 value 2").
 *   values(["row 2, value 1", "row 2, value 2"]).
 *   execute();</pre>
 *
 * @returns {TableInsert}
 */
TableInsert.prototype.values = function () {
    let k, values = [];

    for (k in arguments) {
        values[k] = arguments[k];
    }

    if (arguments.length === 1 && Array.isArray(arguments[0])) {
        values = arguments[0];
    }
    if (this._fields.length !== values.length) {
        throw new Error("Mismatch in column count. " + this._fields.length + " fields listed, " + values.length + " values provided");
    }

    this._rows.push(values);
    return this;
};

/**
 *
 * @returns {Promise.<Result>}
 */
TableInsert.prototype.execute = function () {
    var projection = this._fields.map(function (field) {
        return { name: field };
    });

    return this._session._client.crudInsert(this._schema.getName(), this._table, Client.dataModel.TABLE, this._rows, projection).then(state => new Result(state));
};
