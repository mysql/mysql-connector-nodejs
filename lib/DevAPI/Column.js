/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates. All rights reserved.
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

const Resulset = require('../Protocol/Protobuf/Stubs/mysqlx_resultset_pb');
const collations = require('../Protocol/Collations');

/**
 * API Column types as described by [MY-130]{@tutorial Working_with_Tables}.
 * @readonly
 * @name ColumnType
 * @enum {string}
 */
const ColumnType = {
    BIT: 'BIT',
    TINYINT: 'TINYINT',
    SMALLINT: 'SMALLINT',
    MEDIUMINT: 'MEDIUMINT',
    INT: 'INT',
    BIGINT: 'BIGINT',
    FLOAT: 'FLOAT',
    DECIMAL: 'DECIMAL',
    DOUBLE: 'DOUBLE',
    JSON: 'JSON',
    STRING: 'STRING',
    BYTES: 'BYTES',
    TIME: 'TIME',
    DATE: 'DATE',
    DATETIME: 'DATETIME',
    TIMESTAMP: 'TIMESTAMP',
    SET: 'SET',
    ENUM: 'ENUM',
    GEOMETRY: 'GEOMETRY'
};

/**
 * Column metadata wrapper factory.
 * @module Column
 */

/**
 * Extract X DevAPI type for binary content.
 * @private
 * @param {Mysqlx.Resultset.ContentType_BYTES} [contentType] - the column content type
 * @param {number} [collation] - the collation id
 * @returns {Column.Type}
 */
function columnAsBinaryType (contentType, collation) {
    const isBinary = collations.find(collation).charset === 'binary';

    if (contentType === Resulset.ContentType_BYTES.JSON) {
        return ColumnType.JSON;
    }

    if (contentType === Resulset.ContentType_BYTES.GEOMETRY) {
        return ColumnType.GEOMETRY;
    }

    if (!isBinary) {
        return ColumnType.STRING;
    }

    return ColumnType.BYTES;
}

/**
 * Extract X DevAPI type for date and time content.
 * @private
 * @param {Mysqlx.Resultset.ContentType_DATETIME} [contentType] - the column content type
 * @param {number} [flags] - the column flag set
 * @returns {Type}
 */
function columnAsDateAndTime (contentType, flags) {
    // X Protocol type specific flag as defined by Mysqlx.Resultset.ColumnMetadata docs
    const isTimestamp = flags & 1;

    if (contentType === Resulset.ContentType_DATETIME.DATE) {
        return ColumnType.DATE;
    }

    if (!isTimestamp) {
        return ColumnType.DATETIME;
    }

    return ColumnType.TIMESTAMP;
}

/**
 * Extract X DevAPI type for SQL DECIMAL values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {string}
 */
function columnAsDecimal (flags) {
    if (!isUnsignedType(flags)) {
        return ColumnType.DECIMAL;
    }

    return `UNSIGNED ${ColumnType.DECIMAL}`;
}

/**
 * Extract X DevAPI type for SQL DOUBLE values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {string}
 */
function columnAsDouble (flags) {
    if (!isUnsignedType(flags)) {
        return ColumnType.DOUBLE;
    }

    return `UNSIGNED ${ColumnType.DOUBLE}`;
}

/**
 * Extract X DevAPI type for SQL FLOAT values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {Type}
 */
function columnAsFloat (flags) {
    if (!isUnsignedType(flags)) {
        return ColumnType.FLOAT;
    }

    return `UNSIGNED ${ColumnType.FLOAT}`;
}

/**
 * Extract X DevAPI type for SQL *INT values.
 * @private
 * @param {number} [size] - the column size
 * @returns {Type}
 */
function columnAsInteger (size) {
    if (size >= 20) {
        return ColumnType.BIGINT;
    }

    if (size >= 10) {
        return ColumnType.INT;
    }

    if (size >= 8) {
        return ColumnType.MEDIUMINT;
    }

    if (size >= 5) {
        return ColumnType.SMALLINT;
    }

    return ColumnType.TINYINT;
}

/**
 * Extract X DevAPI type for SQL signed integers.
 * @private
 * @param {number} size - the column size
 * @returns {Type}
 */
function columnAsSignedInteger (size) {
    return columnAsInteger(size);
}

/**
 * Extract X DevAPI type for SQL unsigned integers.
 * @private
 * @param {number} size - the column size
 * @returns {string}
 */
function columnAsUnsignedInteger (size) {
    return `UNSIGNED ${columnAsInteger(size)}`;
}

/**
 * Checks if the column flags match unsigned-specific types.
 * @private
 * @param {number} flags - the column flag set encoded as a decimal number
 * @returns {boolean}
 */
function isUnsignedType (flags) {
    // X Protocol type specific flag as defined by Mysqlx.Resultset.ColumnMetadata docs
    return flags === 1;
}

/**
 * @private
 * @alias module:Column
 * @param {object} [state] - raw column metadata
 * @returns {Column} The Column instance
 */
function Column (state) {
    state = Object.assign({}, state);

    return {
        /**
         * Retrieve the name of the charset being used.
         * @function
         * @name module:Column#getCharacterSetName
         * @returns {string}
         */
        getCharacterSetName () {
            if (!state.collation) {
                return;
            }

            return collations.find(state.collation).charset;
        },

        /**
         * Retrieve the name of the collation being used.
         * @function
         * @name module:Column#getCollationName
         * @returns {string}
         */
        getCollationName () {
            if (!state.collation) {
                return;
            }

            return collations.find(state.collation).name;
        },

        /**
         * Retrieve the alias of the column.
         * @function
         * @name module:Column#getColumnLabel
         * @returns {string}
         */
        getColumnLabel () {
            return state.name;
        },

        /**
         * Retrieve the actual name of the column.
         * @function
         * @name module:Column#getColumnName
         * @returns {string}
         */
        getColumnName () {
            return state.originalName;
        },

        /**
         * Retrieve the number of fractional digits allowed for the column (DECIMAL or similar types).
         * @function
         * @name module:Column#getFractionalDigits
         * @returns {number}
         */
        getFractionalDigits () {
            return state.fractionalDigits;
        },

        /**
         * Retrieve the allowed size of the column.
         * @function
         * @name module:Column#getLength
         * @returns {number}
         */
        getLength () {
            return state.length;
        },

        /**
         * Retrieve the name of the schema where the table belongs to.
         * @function
         * @name module:Column#getSchemaName
         * @returns {string}
         */
        getSchemaName () {
            return state.schema;
        },

        /**
         * Retrieve the alias of the table where the column belongs to.
         * @function
         * @name module:Column#getTableLabel
         * @returns {string}
         */
        getTableLabel () {
            return state.table;
        },

        /**
         * Retrieve the actual name of the table where the column belongs to.
         * @function
         * @name module:Column#getTableName
         * @returns {string}
         */
        getTableName () {
            return state.originalTable;
        },

        /**
         * Retrieve the X DevAPI type of the column.
         * @function
         * @name module:Column#getType
         * @returns {ColumnType}
         */
        getType () {
            switch (state.type) {
            case Resulset.ColumnMetaData.FieldType.SINT:
                return columnAsSignedInteger(state.length);
            case Resulset.ColumnMetaData.FieldType.UINT:
                return columnAsUnsignedInteger(state.length);
            case Resulset.ColumnMetaData.FieldType.DOUBLE:
                return columnAsDouble(state.flags);
            case Resulset.ColumnMetaData.FieldType.FLOAT:
                return columnAsFloat(state.flags);
            case Resulset.ColumnMetaData.FieldType.BYTES:
                return columnAsBinaryType(state.contentType, state.collation);
            case Resulset.ColumnMetaData.FieldType.TIME:
                return ColumnType.TIME;
            case Resulset.ColumnMetaData.FieldType.DATETIME:
                return columnAsDateAndTime(state.contentType, state.flags);
            case Resulset.ColumnMetaData.FieldType.SET:
                return ColumnType.SET;
            case Resulset.ColumnMetaData.FieldType.ENUM:
                return ColumnType.ENUM;
            case Resulset.ColumnMetaData.FieldType.BIT:
                return ColumnType.BIT;
            case Resulset.ColumnMetaData.FieldType.DECIMAL:
                return columnAsDecimal(state.flags);
            }
        },

        /**
         * Check if the column value is signed or not (for INT or similar types).
         * @function
         * @name module:Column#isNumberSigned
         * @returns {boolean}
         */
        isNumberSigned () {
            return state.type === Resulset.ColumnMetaData.FieldType.SINT;
        },

        /**
         * Check if the column value is being padded.
         * @function
         * @name module:Column#isPadded
         * @returns {string}
         */
        isPadded () {
            return !!(state.flags & 1);
        }
    };
}

/**
 * Column type.
 * @type {ColumnType}
 * @const
 * @private
 */
Column.Type = ColumnType;

module.exports = Column;
