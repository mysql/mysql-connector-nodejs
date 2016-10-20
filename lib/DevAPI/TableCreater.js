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
    TableSelect = require('./TableSelect'),
    ColumnDefinition = require('./ColumnDefinition');

/**
 * Create a new Table.
 *
 * Usually you shouldn't call this constructor directly, but ask {@link Schema#createTable} for it.
 *
 * @see {@link Schema#createTable}
 * @param {Schema} schema
 * @param {string} name
 * @param {bool} reuseExisting
 * @constructor
 */
function TableCreater(schema, name, reuseExisting) {
    this._schema = schema;
    this._name = name;
    this._reuseExisting = !!reuseExisting;

    this._as = false;
    this._fields = [];

    this._primary = false;
    this._indexes = [];
    this._foreignKey = [];

    this._autoinc = false;

    this._charset = false;
    this._collation = false;

    this._comment = false;

    this._temporary = false;
}

module.exports = TableCreater;

/**
 * Create a table by selecting another
 *
 * @param {String|TableSelect} statement
 * @returns {TableCreater}
 */
TableCreater.prototype.as = function (statement) {
    if (this._fields.length) {
        throw new Error("Can't use as after manually setting fields");
    }

    if (statement instanceof TableSelect) {
        statement = statement.getViewDefinition();
    }

    this._as = statement;

    return this;
};

/**
 * Add a column
 * @param {ColumnDefinition} def - Column definition
 * @returns {TableCreater}
 */
TableCreater.prototype.addColumn = function (def) {
    if (this._as) {
        throw new Error("Can't add columns manually after setting as()");
    }
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
 * @returns {TableCreater}
 */
TableCreater.prototype.addPrimaryKey = function (field) {
    const fields = Array.from(arguments);
    this._primary = fields;
    return this;
};

/**
 * Add an index
 * 
 * @param {String} indexName - Name of index
 * @param {...String} field - Field names
 * @returns {TableCreater}
 */
TableCreater.prototype.addIndex = function (indexName, field) {
    const fields = Array.from(arguments);
    fields.shift();
    this._indexes.push({ type: "INDEX", name: indexName, fields: fields });
    return this;
};

/**
 * Add a unique index
 *
 * @param {Sting} indexName - Name of index
 * @param {..String] field - Field names
 * @returns {TableCreater}
 */
TableCreater.prototype.addUniqueIndex = function (indexName, field) {
    const fields = Array.from(arguments);
    fields.shift();
    this._indexes.push({ type: "UNIQUE", name: indexName, fields: fields });
    return this;
};

/**
 * Add a Foreign Key Constraint
 * @param {ForeignKeyDefinition} def
 * @returns {TableCreater}
 */
TableCreater.prototype.addForeignKey = function (def) {
    this._foreignKey.push(def);
    return this;
};

/**
 * Set initial auto increment value
 *
 * @param {Number} value
 * @returns {TableCreater}
 */
TableCreater.prototype.setInitialAutoIncrement = function (value) {
    this._autoinc = 1 * value;
    return this;
};

/**
 * Set default charset for table
 *
 * @param {String} charsetName
 * @returns {TableCreater}
 */
TableCreater.prototype.setDefaultCharset = function (charsetName) {
    if (!charsetName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error("Invalid character set name");
    }
    this._charset = charsetName;
    return this;
};

/**
 * Set default collation for table
 * @param {String} collationName
 * @returns {TableCreater}
 */
TableCreater.prototype.setDefaultCollation = function(collationName) {
    if (!collationName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error("Invalid collation name");
    }
    this._collation = collationName;
    return this;
};

/**
 * Set comment for table
 * @param {String} comment
 * @returns {TableCreater}
 */
TableCreater.prototype.setComment = function (comment) {
    this._comment = comment;
    return this;
};

/**
 * Mark table as temporary
 * @returns {TableCreater}
 */
TableCreater.prototype.temporary = function () {
    this._temporary = true;
    return this;
};

/**
 * Execute table creation
 *
 * This actually creates the table. On success the returned Promise resolves to a Table object for the new table, else
 * the Promise is rejected with an error
 *
 * @returns {Promise.<Table>}
 */
TableCreater.prototype.execute = function () {
    const options = [];

    if (this._autoinc) {
        options.push(" AUTO_INCREMENT = " + this._autoinc);
    }

    if (this._charset) {
        options.push(" CHARACTER SET = " + this._charset);
    }

    if (this._collation) {
        options.push(" COLLATE = " + this._collation);
    }

    if (this._comment) {
        // TODO escape!
        options.push(" COMMENT '" + this._comment + "'");
    }

    const sql = 'CREATE ' + (this._temporary ? 'TEMPORARY ' : '') + 'TABLE ' +
        (this._reuseExisting ? 'IF NOT EXISTS ' : '') +
        Table.escapeIdentifier(this._schema.getSchema()) + '.' + Table.escapeIdentifier(this._name) +
        (this._as ?
            this._as :
            (
                "(\n" +this._fields.map(f => f.get()).join(",\n") +
                  (this._primary ? ", PRIMARY KEY (" + this._primary.map(Table.escapeIdentifier).join(", ") + ")" : "") +

                  this._indexes.map(index => ", " + index.type + " " +
                      Table.escapeIdentifier(index.name) + " (" +index.fields.map(Table.escapeIdentifier).join(", ") + ")"
                  ).join("\n") +

                  this._foreignKey.map(fk => fk.get()).join("\n") +
                ")"
            )
        ) +
        options.join(", ");
    
    return this._schema._session._client.sqlStmtExecute(sql).then(() => new Table(this._name));
};
