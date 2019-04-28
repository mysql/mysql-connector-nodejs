/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

const FieldType = require('../Protocol/Protobuf/Stubs/mysqlx_resultset_pb').ColumnMetaData.FieldType;
const collations = require('../Protocol/Collations');

/**
 * Column metadata object.
 * @module Column
 */

/**
 * @alias module:Column
 * @private
 * @param metadata
 * @constructor
 */
function Column (meta) {
    for (let m in meta) {
        this[m] = meta[m];
    }
}

module.exports = Column;

Column.TYPE = {
    BIT: 1,
    TINYINT: 2,
    SMALLINT: 3,
    MEDIUMINT: 4,
    INT: 5,
    BIGINT: 6,
    FLOAT: 7,
    DECIMAL: 8,
    DOUBLE: 9,
    JSON: 10,
    STRING: 11,
    BYTES: 12,
    TIME: 13,
    DATE: 14,
    DATETIME: 15,
    TIMESTAMP: 16,
    SET: 17,
    ENUM: 18,
    GEOMETRY: 19
};

const types = [];
for (let type in Column.TYPE) {
    types[Column[type]] = type;
}

// Internal only: Creates wrapper or user-defined meta callback to creat Column instances
Column.metaCB = function (orig) {
    if (orig) {
        return function (meta) {
            return orig(meta.map(m => new Column(m)));
        };
    }
};

/**
 * Get Column type
 *
 * @private
 * @param id
 * @returns {ColumnType}
 */
Column.getTypeForId = function (id) {
    return types[id];
};

/**
 * Retrieve the name of the schema where the table belongs to.
 * @returns {string}
 */
Column.prototype.getSchemaName = function () {
    return this.schema;
};

/**
 * Retrieve the actual name of the table where the column belongs to.
 * @returns {string}
 */
Column.prototype.getTableName = function () {
    return this.originalTable;
};

/**
 * Retrieve the alias of the table where the column belongs to.
 * @returns {string}
 */
Column.prototype.getTableLabel = function () {
    return this.table;
};

/**
 * Retrieve the actual name of the column.
 * @returns {string}
 */
Column.prototype.getColumnName = function () {
    return this.originalName;
};

/**
 * Retrieve the alias of the column.
 * @returns {string}
 */
Column.prototype.getColumnLabel = function () {
    return this.name;
};

/**
 * Retrieve the SQL type of the column.
 * @returns {number}
 */
Column.prototype.getType = function () {
    return this.type;
};

/**
 * Retrieve the allowed size of the column.
 * @returns {number}
 */
Column.prototype.getLength = function () {
    return this.length;
};

/**
 * Retrieve the number of fractional digits allowed for the column (DECIMAL or similar types).
 * @returns {number}
 */
Column.prototype.getFractionalDigits = function () {
    return this.fractionalDigits;
};

/**
 * Check if the column value is signed or not (for INT or similar types).
 * @returns {boolean}
 */
Column.prototype.isNumberSigned = function () {
    return this.type === FieldType.SINT;
};

/**
 * Retrieve the name of the collation being used.
 * @returns {string}
 */
Column.prototype.getCollationName = function () {
    if (!this.collation) {
        return;
    }

    return collations.find(this.collation).name;
};

/**
 * Retrieve the name of the charset being used.
 * @returns {string}
 */
Column.prototype.getCharacterSetName = function () {
    if (!this.collation) {
        return;
    }

    return collations.find(this.collation).charset;
};

/**
 * Check if the column value is being padded.
 * @returns {string}
 */
Column.prototype.isPadded = function () {
    return !!(this.flags & 1);
};
