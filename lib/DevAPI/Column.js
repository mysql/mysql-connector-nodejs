/*
 * Copyright (c) 2016, 2022, Oracle and/or its affiliates.
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

const ColumnType = require('../Protocol/Wrappers/Messages/Resultset/ColumnMetadata').COLUMN_TYPE;

/**
 * Column metadata wrapper factory.
 * @module Column
 */

/**
 * @private
 * @alias module:Column
 * @param {module:ColumnMetadata} [metadata] - metadata protocol object
 * @returns {Column} The Column instance
 */
function Column (metadata) {
    return {
        /**
         * Retrieve the name of the charset being used.
         * @function
         * @name module:Column#getCharacterSetName
         * @returns {string}
         */
        getCharacterSetName () {
            return metadata.getCharset();
        },

        /**
         * Retrieve the name of the collation being used.
         * @function
         * @name module:Column#getCollationName
         * @returns {string}
         */
        getCollationName () {
            return metadata.getCollation();
        },

        /**
         * Retrieve the alias of the column.
         * @function
         * @name module:Column#getColumnLabel
         * @returns {string}
         */
        getColumnLabel () {
            return metadata.getAlias();
        },

        /**
         * Retrieve the actual name of the column.
         * @function
         * @name module:Column#getColumnName
         * @returns {string}
         */
        getColumnName () {
            return metadata.getName();
        },

        /**
         * Retrieve the number of fractional digits allowed for the column (DECIMAL or similar types).
         * @function
         * @name module:Column#getFractionalDigits
         * @returns {number}
         */
        getFractionalDigits () {
            return metadata.getFractionalDigits();
        },

        /**
         * Retrieve the allowed size of the column.
         * @function
         * @name module:Column#getLength
         * @returns {number}
         */
        getLength () {
            return metadata.getLength();
        },

        /**
         * Retrieve the name of the schema where the table belongs to.
         * @function
         * @name module:Column#getSchemaName
         * @returns {string}
         */
        getSchemaName () {
            return metadata.getSchema();
        },

        /**
         * Retrieve the alias of the table where the column belongs to.
         * @function
         * @name module:Column#getTableLabel
         * @returns {string}
         */
        getTableLabel () {
            return metadata.getTableAlias();
        },

        /**
         * Retrieve the actual name of the table where the column belongs to.
         * @function
         * @name module:Column#getTableName
         * @returns {string}
         */
        getTableName () {
            return metadata.getTableName();
        },

        /**
         * Retrieve the X DevAPI type of the column.
         * @function
         * @name module:Column#getType
         * @returns {ColumnType}
         */
        getType () {
            return metadata.getTypeString();
        },

        /**
         * Check if the column value is signed or not (for INT or similar types).
         * @function
         * @name module:Column#isNumberSigned
         * @returns {boolean}
         */
        isNumberSigned () {
            return metadata.isSigned();
        },

        /**
         * Check if the column value is being padded.
         * @function
         * @name module:Column#isPadded
         * @returns {string}
         */
        isPadded () {
            return metadata.isFlagged();
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
