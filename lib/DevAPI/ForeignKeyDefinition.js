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

const referenceOptions = {
    'RESTRICT': true,
    'CASCADE': true,
    'SET NULL': true,
    'NO ACTION': true
};

/**
 * Object describing a Foreign Key Definition. Created usually via {@link Schema#foreignKey} and
 * injected to {@link TableFactory#addForeignKey}.
 *
 * @see {Schema#foreignKey}
 * @see {TableFactory#addForeignKey}
 * @param {Schema} schema
 * @constructor
 */
function ForeignKeyDefinition(schema) {
    this._schema = schema;
    this._fields = [];
    this._refTable = false;
    this._references = [];
    this._onDelete = false;
    this._onUpdate = false;
}

module.exports = ForeignKeyDefinition;

/**
 * Set the fields referenced from
 * @param {...String} field - Field names
 * @return {ForeignKeyDefinition}
 */
ForeignKeyDefinition.prototype.fields = function(field) {
    this._fields = Array.from(arguments);
    return this;
};

/**
 * Set the table and fields referenced to
 *
 * @param {String} table - Name of the referenced table
 * @param {...String} field - Field names
 * @return {ForeignKeyDefinition}
 */
ForeignKeyDefinition.prototype.refersTo = function(table, field) {
    const fields = Array.from(arguments);
    fields.shift();
    this._refTable = table;
    this._references = fields;
    return this;
};

/**
 * Set ON DELETE reference option
 *
 * Should be one of RESTRICT | CASCADE | SET NULL | NO ACTION
 *
 * @param {String} option
 * @returns {ForeignKeyDefinition}
 */
ForeignKeyDefinition.prototype.onDelete = function (option) {
    if (!referenceOptions[option.toUpperCase()]) {
        throw new Error("Invalid reference option");
    }
    this._onDelete = option;
    return this;
};

/**
 * Set ON UPDATE reference option
 *
 * Should be one of RESTRICT | CASCADE | SET NULL | NO ACTION
 *
 * @param {String} option
 * @returns {ForeignKeyDefinition}
 */
ForeignKeyDefinition.prototype.onUpdate = function (option) {
    if (!referenceOptions[option.toUpperCase()]) {
        throw new Error("Invalid reference option");
    }
    this._onUpdate = option;
    return this;
};

/**
 * @private
 * @return {String}
 */
ForeignKeyDefinition.prototype.get = function () {
    return " FOREIGN KEY (" + this._fields.map(f => Table.escapeIdentifier(f)).join(", ") + ")" +
        " REFERENCES " + Table.escapeIdentifier(this._schema.getName()) + "." + Table.escapeIdentifier(this._refTable) + " (" + this._references.map(f => Table.escapeIdentifier(f)).join(", ") + ")" +
        (this._onDelete ? " ON DELETE " + this._onDelete : "") +
        (this._onUpdate ? " ON UPDATE " + this._onUpdate : "")
    ;
};
