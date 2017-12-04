/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

/**
 * Represents meta data for a Table column
 *
 * @param metadata
 * @constructor
 */
function Column(meta) {
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
 * Get name of the schema this column belongs to
 * @returns {String}
 */
Column.prototype.getSchemaName = function () {
    return this.schema;
};

/**
 * Get the actual name of the table the field belongs to
 * @returns {String}
 */
Column.prototype.getTableName = function () {
    return this.original_table;
};

/**
 * Get the aliased name of the table the field belongs to
 * @returns {String}
 */
Column.prototype.getTableLabel = function () {
    return this.table;
};

/**
 * Get the actual name of the field
 * @returns {*}
 */
Column.prototype.getColumnName = function () {
    return this.original_name;
};

/**
 * Get the aliased name of the field
 * @returns {*}
 */
Column.prototype.getColumnLabel = function () {
    return this.name;
};

/**
 * Get the type of the field
 * @returns {int}
 */
Column.prototype.getType = function () {
    return this.type;
};

/**
 * Get the length of the field
 * @returns {int}
 */
Column.prototype.getLength = function () {
    return this.length;
};

/**
 * Get the amount of fractional digits fo DECIMAL or similar fields
 * @returns {int}
 */
Column.prototype.getFractionalDigits = function () {
    return this.fractional_digits;
};

/*Column.prototype.isNumberSigned = function () {

};*/

/*
// collation name as defined by mapping table
String getCollationName();
// character set name extracted from collation number/name
String getCharacterSetName();
// whether unsigned integers should be zero-filled or strings should be space-padded
// determined by flags UINT zerofill and BYTES rightpad
bool isPadded();
*/
