/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

const DatabaseObject = require('./DatabaseObject');
const LinkOperations = require('./LinkOperations');
const TableDelete = require('./TableDelete');
const TableInsert = require('./TableInsert');
const TableSelect = require('./TableSelect');
const TableUpdate = require('./TableUpdate');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const util = require('util');

/**
 * Table object
 *
 * Usually you shouldn't create an instance of this but ask a Schema for it
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {String} table
 * @param {String} alias
 * @param {object} links
 * @constructor
 * @extends DatabaseObject
 */
function Table (session, schema, table, alias, links) {
    DatabaseObject.call(this, session, schema);

    this._table = table;
    this._links = links || {};
    this._alias = alias;
}

module.exports = Table;

util.inherits(Table, DatabaseObject);
LinkOperations.applyTo(Table);

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
    const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
    const args = ['def', this._schema.getName(), this._table];
    let status = false;

    return this._session._client
        .sqlStmtExecute(query, args, (found) => { status = !!found.length; })
        .then(() => status);
};

/**
 * Checks whether this table is a View
 * @returns {Promise<boolean>}
 */
Table.prototype.isView = function () {
    const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
    const args = ['def', this._schema.getName(), this._table];
    let status = false;

    return this._session._client
        .sqlStmtExecute(query, args, (found) => { status = !!found.length; })
        .then(() => status);
};

/**
 * Select rows from a table
 * @param {...string|string[]} [ProjectedSearchExpr] - columns to be projected
 * @throws {Error} When an expression is invalid.
 * @example
 * // all columns should be projected
 * const selection = table.select()
 *
 * // arguments as columns to be projected
 * const selection = table.select('foo', 'bar')
 *
 * // array of columns to be projected
 * const selection = table.select(['foo', 'bar'])
 * @returns {TableSelect}
 */
Table.prototype.select = function () {
    const fields = parseFlexibleParamList(Array.prototype.slice.call(arguments));

    return new TableSelect(this._session, this._schema, this._table, fields);
};

/**
 * Insert rows
 * @param {...string|string[]|Object} TableField - column names or column-value object
 * @throws {Error} When the input type is invalid.
 * @example
 * // arguments as column names
 * table.insert('foo', 'bar')
 *
 * // array of column names
 * table.insert(['foo', 'bar'])
 *
 * // object with column name and value
 * table.insert({ foo: 'baz', bar: 'qux' })
 * @returns {TableInsert}
 */
Table.prototype.insert = function () {
    if (!Array.isArray(arguments[0]) && typeof arguments[0] !== 'string') {
        const fields = arguments[0];

        if (typeof fields !== 'object') {
            throw new Error('fields must be provided as multiple Strings, an Array or an Object with the column name and value');
        }

        const columns = Object.keys(fields);
        const values = columns.map(column => fields[column]);

        return (new TableInsert(this._session, this._schema, this._table, columns)).values(values);
    }

    const columns = parseFlexibleParamList(Array.prototype.slice.call(arguments));

    return new TableInsert(this._session, this._schema, this._table, columns);
};

/**
 * Run update operations
 * @param {String} expr Expression
 * @returns {TableUpdate}
 */
Table.prototype.update = function (expr) {
    return new TableUpdate(this._session, this._schema, this._table, expr);
};

/**
 * Create operation to delete rows from a table.
 * @param {string} expr Expression
 * @example
 * // delete all rows from a table
 * table.delete('true')
 *
 * // delete rows that match a given criteria
 * table.delete('`name` == "foobar"')
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
    const schema = Table.escapeIdentifier(this._schema.getName());
    const table = Table.escapeIdentifier(this._table);

    return this._session._client
        .sqlStmtExecute(`DROP TABLE ${schema}.${table}`)
        .then(() => true);
};

/**
 * Get number of rows in this Table
 *
 * @returns {Promise.<Number>}
 */
Table.prototype.count = function () {
    const schema = Table.escapeIdentifier(this._schema.getName());
    const table = Table.escapeIdentifier(this._table);

    let count = 0;

    return this._session._client
        .sqlStmtExecute(`SELECT COUNT(*) FROM ${schema}.${table}`, [], row => { count = row[0]; })
        .then(() => count);
};

/**
 * Set an alias for link operation
 *
 * @param {String} alias
 * @returns {Table}
 */
Table.prototype.as = function (alias) {
    return new Table(this._session, this._schema, this._table, alias, this._links);
};

Table.prototype.inspect = function () {
    return { schema: this._schema.getName(), table: this._table };
};
