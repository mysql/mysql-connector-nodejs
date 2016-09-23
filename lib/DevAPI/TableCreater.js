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

const Table = require('./Table'),
    ColumnDefinition = require('./ColumnDefinition');

/**
 * Create a new Table
 *
 * Usually you shouldn't call this constructor directly, but ask a Schema for it
 *
 * @param {Schema} schema
 * @param {string} name
 * @param {bool} reuseExisting
 * @constructor
 */
function TableCreate(schema, name, reuseExisting) {
    this._schema = schema;
    this._name = name;
    this._reuseExisting = !!reuseExisting;

    this._fields = [];

    this._primary = false;
    this._indexes = [];
    this._uniques = [];

    this._autoinc = false;

    this._charset = false;
    this._collation = false;

    this._comment = false;

    this._temporary = false;
}

module.exports = TableCreate;

/*
TableCreate.prototype.as()
 */

/**
 * Add a column
 * @param [ColumnDefinition} def - Column definition
 */
TableCreate.prototype.addColumn = function (def) {
    if (!(def instanceof ColumnDefinition)) {
        throw new Error("No column definition provided");
    }
    this._fields.push(def);
    return this;
};

/**
 * Set Primary Key fields
 *
 * @param {...String} field - Field names
 * @returns {TableCreate}
 */
TableCreate.prototype.addPrimaryKey = function (field) {
    this._primary = arguments;
    return this;
};

/**
 * Add an index
 * @param {String} indexName - Name of index
 * @param {...String} field - Field names
 * @returns {TableCreate}
 */
TableCreate.prototype.addIndex = function (indexName, field) {
    this._indexes.push({ name: indexName, fields: arguments });
    return this;
};

/**
 * Add a unique index
 *
 * @param {Sting} indexName - Name of index
 * @param {..String] field - Field names
 * @returns {TableCreate}
 */
TableCreate.prototype.addUniqueIndex = function (indexName, field) {
    this._uniques.push({ name: indexName, fields: arguments });
    return this;
};

//    .addForeignKey(new ForeignKeyDef())

/**
 * Set initial auto increment value
 *
 * @param {Number} value
 * @returns {TableCreate}
 */
TableCreate.prototype.setInitialAutoIncrement = function (value) {
    this._autoinc = 0 + value;
    return this;
};

/**
 * Set default charset for table
 *
 * @param {String} charsetName
 * @returns {TableCreate}
 */
TableCreate.prototype.setDefaultCharset = function (charsetName) {
    this._charset = charsetName;
    return this;
};

/**
 * Set default collation for table
 * @param {String} collationName
 * @returns {TableCreate}
 */
TableCreate.prototype.setDefaultCollation = function(collationName) {
    this._collation = collationName;
    return this;
};

/**
 * Set comment for table
 * @param {tring} comment
 * @returns {TableCreate}
 */
TableCreate.prototype.setComment = function (comment) {
    this._comment = comment;
    return this;
};

/**
 * Mark table as temporary
 * @returns {TableCreate}
 */
TableCreate.prototype.temporary = function () {
    this._temporary = true;
    return this;
};

/**
 * Execute table reation
 *
 * This actually creates the table. On succes the returned Promise resolves to true, else
 * the Promise i rejected with an error
 *
 * @returns {Promise.<boolean>}
 */
TableCreate.prototype.execute = function () {
    const options = [];

    if (this._autoinc) {
        options.push("AUTO_INCREMENT = " + this._autoinc);
    }

    if (this._charset) {
        // TODO escape!
        options.push("CHARACTER SET = " + this._charset);
    }

    if (this._collation) {
        // TODO escape!
        options.push("COLLATE = " + this._collation);
    }

    if (this._comment) {
        // TODO escape!
        options.push("COMMENT = '" + this._comment + "'");
    }

    const sql = 'CREATE ' + (this._temporary ? 'TEMPORARY ' : '') + 'TABLE ' +
        (this._reuseExisting ? 'IF NOT EXISTS ' : '') +
        Table.escapeIdentifier(this._schema.getSchema()) + '.' + Table.escapeIdentifier(this._name) +
        "(\n" +this._fields.map(f => f.get()).join(",\n") + ")" +
        options.join(", ");

    console.log(sql);
    return this._session._client.sqlStmtExecute(sql).then(() => true);
};
