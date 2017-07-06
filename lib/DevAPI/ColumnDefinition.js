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

"use strict";

const Table = require('./Table');

/**
 * Column Definition for table creation. This is typically created via {@link Schema#columnDef}
 * and injected into {@link TableFactory#addColumn}.
 *
 * @see {Schema#columnDef}
 * @see {TableFactory#addColumn}
 * @param {string} name
 * @param type
 * @param {Number=} length
 * @constructor
 */
function ColumnDefinition(name, type, length) {
    this._name = name;
    this._type = type;
    this._length = length;

    this._notNull = false;
    this._default = false;
    this._autoinc = false;

    this._unique = false;
    this._primary = false;

    this._comment = null;
    this._foreignKey = null;
    this._unsigned = false;
    this._decimals = false;
    this._charset = false;
    this._collation = false;
    this._binary = false;
    this._values = false;
}

module.exports = ColumnDefinition;

/**
 * Set NOT NULL flag
 *
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.notNull = function () {
    this._notNull = true;
    return this;
};

/**
 * Set default value
 *
 * @param value
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.setDefault = function (value) {
    if (typeof value === 'string') {
        // TODO escape
        value = "'" + value + "'";
    }
    this._default = value;
    return this;
};

/**
 * Mark this field as auto increment field
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.autoIncrement = function () {
    this._autoinc = true;
    return this;
};

/**
 * Mark as unique index
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.uniqueIndex = function () {
    this._unique = true;
    return this;
};

/**
 * Mark as primary key
 *
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.primaryKey = function () {
    this._primary = true;
    return this;
};

/**
 * Add a comment
 *
 * @param {String} string
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.comment = function (string) {
    this._comment = string;
    return this;
};

/**
 * Add a foreign key constraint to this field
 *
 * @param {String} table_name named of the referenced table
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.foreignKey = function (tableName, field) {
    const args = Array.from(arguments);
    args.shift();
    this._foreignKey = { table: tableName, fields: args };
    return this;
};

/**
 * Mark as unsigned
 *
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.unsigned = function () {
    this._unsigned = true;
    return this;
};

/**
 * Set number of decimals
 *
 * @param {Number} int
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.decimals = function (int) {
    this._decimals = 0 + int;
    return this;
};

/**
 * Set character set
 *
 * @param {String} charsetName
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.charset = function (charsetName) {
    if (!charsetName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error("Invalid character set name");
    }
    this._charset = charsetName;
    return this;
};

/**
 * Set collation
 * @param {String} collationName
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.collation = function (collationName) {
    if (!collationName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error("Invalid collation name");
    }
    this._collation = collationName;
    return this;
};

/**
 * MArk field as binary
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.binary = function () {
    this._binary = true;
    return this;
};

/**
 * Set values
 *
 * This is used for ENUMs or SET
 *
 * @param {...string} value
 * @returns {ColumnDefinition}
 */
ColumnDefinition.prototype.values = function (value/* ... */) {
    this._values = Array.from(arguments);
    return this;
};

/**
 * @private
 * @return {String}
 */
ColumnDefinition.prototype.get = function () {
    // TODO Instead of using ternaries all over here, we actually could preproduce most of the string parts
    // TODO in the setters above and simply concat here

    let definition = Table.escapeIdentifier(this._name) + ' ' + this._type +
        (this._length ? " (" + this._length +  (this._decimals ? "," + this._decimals : "") + ") " : "") +
        (this._unsigned ? " UNSIGNED " : "") +
        (this._binary ? " BINARY " : "") +
        (this._values ? " (" + this._values.map(v => "'" + v + "'").join(", ") + ")" : "") + // TODO: escape!
        (this._charset ? " CHARACTER SET " + this._charset + " " : "") +
        (this._collation ? " COLLATE " + this._collation + " " : "") +
        (this._notNull ? " NOT NULL " : " NULL ") +
        (this._default ? " DEFAULT " + this._default + " " : "") +
        (this._autoinc ? " AUTO_INCREMENT " : "") +
        (this._unique ? " UNIQUE " : "") +
        (this._primary ? " PRIMARY KEY " : "") +
        (this._comment ? " COMMENT '" + this._comment + "'" : "") + // TODO: escape!
        (this._foreignKey ? " REFERENCES " + Table.escapeIdentifier(this._foreignKey.table) + " (" + this._foreignKey.fields.map(f => Table.escapeIdentifier(f)).join(", ") + ")" : "")
    ;
    
    return definition;
};
