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

const util = require('util'),
    DatabaseObject = require('./DatabaseObject'),
    TableSelect = require('./TableSelect'),
    TableInsert = require('./TableInsert'),
    TableUpdate = require('./TableUpdate'),
    TableDelete = require('./TableDelete');

/**
 * Table object
 *
 * Usually you shouldn't create an instance of this but ask a Schema for it
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {String} table
 * @constructor
 * @extends DatabaseObject
 */
function Table(session, schema, table) {
    DatabaseObject.call(this, session, schema);
    this._table = table;
}

module.exports = Table;

util.inherits(Table, DatabaseObject);

Table.escapeIdentifier = function (ident) {
    return '`' + ident.replace('`', '``') + '`';
};

/**
 * Get the name of this table
 * @returns {string}
 */
Table.prototype.getName = function () {
    return this._table;
};

/**
 * Verifies this table exists
 * @returns {Promise<boolean>}
 */
Table.prototype.existsInDatabase = function () {
    var query = "SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1",
        args = [
            "def",
            this._schema.getName(),
            this._table
        ];

    var found = false;

    return this._session._client.sqlStmtExecute(query, args, function () { found = true; }).then(function () {
        return found;
    });
};

/**
 * Checks whether this table is a View
 * @returns {Promise<boolean>}
 */
Table.prototype.isView = function () {
    var query = "SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1",
        args = [
            "def",
            this._schema.getName(),
            this._table
        ];

    var found = false;

    return this._session._client.sqlStmtExecute(query, args, () => { found = true; }).then( () => found );
};

/**
 * Select rows from a table
 * @param {Array<String>} fields Field list
 * @returns {TableSelect}
 */
Table.prototype.select = function (fields) {
    if (!fields) {
        fields = [];
    } else if (!Array.isArray(fields)) {
        throw new TypeError("The field argument for table.select has to be an array of fields");
    }
    return new TableSelect(this._session, this._schema, this._table, fields);
};

/**
 * Insert rows
 *
 * @param {ObjectArray<String>} A single object as field name-value-pair or list of fields
 * @returns {TableInsert}
 */
Table.prototype.insert = function (fields) {
    if (!Array.isArray(fields)) {
        if (typeof fields === 'object') {
            var data = fields;
            fields = [];
            var field, values = [];
            for (field in data) {
                fields.push(field);
                values.push(data[field]);
            }

            return (new TableInsert(this._session, this._schema, this._table, fields)).values(values);
        } else {
            throw new Error("Fields have to be provided as Array or an object with field names and values has to be provided");
        }
    }

    return new TableInsert(this._session, this._schema, this._table, fields);
};

/**
 * Run update operations
 * @param {String} expr Expression
 * @returns {TableUpdate}
 */
Table.prototype.update = function () {
    return new TableUpdate(this._session, this._schema, this._table);
};

/**
 * Delete rows from a table
 * @param {String} expr Expression
 * @returns {TableDelete}
 */
Table.prototype.delete = function (expr) {
    return new TableDelete(this._session, this._schema, this._table, expr);
};

/**
 * Drop this table
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @returns {Promise.<bool>}
 */
Table.prototype.drop = function () {
    var schema = Table.escapeIdentifier(this._schema.getName()),
        table = Table.escapeIdentifier(this._table);

    return this._session._client.sqlStmtExecute("DROP TABLE " + schema + "." + table).then(function () {
        return true;
    });
};

Table.prototype.inspect = function () {
    return { schema: this._schema.getName(), table: this._table };
};

