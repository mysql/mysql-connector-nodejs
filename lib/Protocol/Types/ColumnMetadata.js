/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const ResultsetStub = require('../Protobuf/Stubs/mysqlx_resultset_pb');
const collations = require('../Collations');
const tools = require('../Util');

/**
 * API Column types as described by [MY-130]{@tutorial Working_with_Tables}.
 * @private
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
 * Extract the type string for binary content.
 * @private
 * @param {Mysqlx.Resultset.ContentType_BYTES} [contentType] - the column content type
 * @param {number} [collation] - the collation id
 * @returns {Column.Type}
 */
function columnAsBinaryType (contentType, collation) {
    const isBinary = collations.find(collation).charset === 'binary';

    if (contentType === ResultsetStub.ContentType_BYTES.JSON) {
        return ColumnType.JSON;
    }

    if (contentType === ResultsetStub.ContentType_BYTES.GEOMETRY) {
        return ColumnType.GEOMETRY;
    }

    if (!isBinary) {
        return ColumnType.STRING;
    }

    return ColumnType.BYTES;
}

/**
 * Extract the type string for date and time content.
 * @private
 * @param {Mysqlx.Resultset.ContentType_DATETIME} [contentType] - the column content type
 * @param {number} [flags] - the column flag set
 * @returns {Type}
 */
function columnAsDateAndTime (contentType, flags) {
    // X Protocol type specific flag as defined by Mysqlx.Resultset.ColumnMetaData docs
    const isTimestamp = flags & 1;

    if (contentType === ResultsetStub.ContentType_DATETIME.DATE) {
        return ColumnType.DATE;
    }

    if (!isTimestamp) {
        return ColumnType.DATETIME;
    }

    return ColumnType.TIMESTAMP;
}

/**
 * Extract the type string for SQL DECIMAL values.
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
 * Extract the type string for SQL DOUBLE values.
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
 * Extract the type string for SQL FLOAT values.
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
 * Extract the type string for SQL *INT values.
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
 * Extract the type string for SQL signed integers.
 * @private
 * @param {number} size - the column size
 * @returns {Type}
 */
function columnAsSignedInteger (size) {
    return columnAsInteger(size);
}

/**
 * Extract the type syting for SQL unsigned integers.
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
    // X Protocol type specific flag as defined by Mysqlx.Resultset.ColumnMetaData docs
    return flags === 1;
}

/**
 * @private
 * @alias module:ColumnMetadataMetadata
 * @param {Mysqlx.Resultset.ColumnMetaData} proto - protobuf stub
 * @returns {ColumnMetadata}
 */
function ColumnMetadata (proto) {
    return {
        /**
         * Returns the protobuf message name field.
         * @private
         * @function
         * @name module:ColumnMetadata#getAlias
         * @returns {string}
         */
        getAlias () {
            return tools.createBufferFromTypedArray(proto.getName()).toString();
        },

        /**
         * Returns the character set name of the respective collation id.
         * @private
         * @function
         * @name module:ColumnMetadata#getCharset
         * @returns {string}
         */
        getCharset () {
            if (!proto.hasCollation()) {
                return;
            }

            return collations.find(proto.getCollation()).charset;
        },

        /**
         * Returns the collation name of the respective collation id.
         * @private
         * @function
         * @name module:ColumnMetadata#getCollation
         * @returns {string}
         */
        getCollation () {
            if (!proto.hasCollation()) {
                return;
            }

            return collations.find(proto.getCollation()).name;
        },

        /**
         * Returns the value of the fractionalDigits protobuf message field.
         * @private
         * @function
         * @name module:ColumnMetadata#getFractionalDigits
         * @returns {number}
         */
        getFractionalDigits () {
            return proto.getFractionalDigits();
        },

        /**
         * Returns the value of the length protobuf message field.
         * @private
         * @function
         * @name module:ColumnMetadata#getLength
         * @returns {number}
         */
        getLength () {
            return proto.getLength();
        },

        /**
         * Returns the value of the originalName protobuf message field converted to a utf8 string.
         * @private
         * @function
         * @name module:ColumnMetadata#getName
         * @returns {string}
         */
        getName () {
            return tools.createBufferFromTypedArray(proto.getOriginalName()).toString();
        },

        /**
         * Returns the value of the schema protobuf message field encoded as an utf8 string.
         * @private
         * @function
         * @name module:ColumnMetadata#getSchema
         * @returns {string}
         */
        getSchema () {
            return tools.createBufferFromTypedArray(proto.getSchema()).toString();
        },

        /**
         * Returns the value of the table protobuf message field encoded as an utf8 string.
         * @private
         * @function
         * @name module:ColumnMetadata#getTableAlias
         * @returns {string}
         */
        getTableAlias () {
            return tools.createBufferFromTypedArray(proto.getTable()).toString();
        },

        /**
         * Returns the value of the originalTable protobuf message field encoded as an utf8 string.
         * @private
         * @function
         * @name module:ColumnMetadata#getTableName
         * @returns {string}
         */
        getTableName () {
            return tools.createBufferFromTypedArray(proto.getOriginalTable()).toString();
        },

        /**
         * Returns the type id of the underlying protocol message.
         * @private
         * @function
         * @name module:ColumnMetadata#getTypeId
         * @returns {number}
         */
        getTypeId () {
            return proto.getType();
        },

        /**
         * Decodes the type string of the column using its type id.
         * @private
         * @function
         * @name module:ColumnMetadata#getTypeString
         * @returns {string}
         */
        getTypeString () {
            switch (proto.getType()) {
            case ResultsetStub.ColumnMetaData.FieldType.SINT:
                return columnAsSignedInteger(proto.getLength());
            case ResultsetStub.ColumnMetaData.FieldType.UINT:
                return columnAsUnsignedInteger(proto.getLength());
            case ResultsetStub.ColumnMetaData.FieldType.DOUBLE:
                return columnAsDouble(proto.getFlags());
            case ResultsetStub.ColumnMetaData.FieldType.FLOAT:
                return columnAsFloat(proto.getFlags());
            case ResultsetStub.ColumnMetaData.FieldType.BYTES:
                return columnAsBinaryType(proto.getContentType(), proto.getCollation());
            case ResultsetStub.ColumnMetaData.FieldType.TIME:
                return ColumnType.TIME;
            case ResultsetStub.ColumnMetaData.FieldType.DATETIME:
                return columnAsDateAndTime(proto.getContentType(), proto.getFlags());
            case ResultsetStub.ColumnMetaData.FieldType.SET:
                return ColumnType.SET;
            case ResultsetStub.ColumnMetaData.FieldType.ENUM:
                return ColumnType.ENUM;
            case ResultsetStub.ColumnMetaData.FieldType.BIT:
                return ColumnType.BIT;
            case ResultsetStub.ColumnMetaData.FieldType.DECIMAL:
                return columnAsDecimal(proto.getFlags());
            }
        },

        /**
         * Checks if the column represents binary content.
         * @private
         * @function
         * @name module:ColumnMetadata#isBinary
         * @returns {boolean}
         */
        isBinary () {
            // TODO(Rui): not sure how to actually handle GEOMETRY values, so let's handle them as binary content for now
            return (!proto.hasContentType() && this.getCharset() === 'binary') ||
                proto.getContentType() === ResultsetStub.ContentType_BYTES.GEOMETRY;
        },

        /**
         * Checks if the value of the flags protobuf message field indicates padding.
         * @private
         * @function
         * @name module:ColumnMetadata#isFlagged
         * @returns {string}
         */
        isFlagged () {
            return !!(proto.getFlags() & 1);
        },

        /**
         * Checks if the content type of the column is JSON.
         * @private
         * @function
         * @name module:ColumnMetadata#isJSON
         * @returns {boolean}
         */
        isJSON () {
            return proto.getContentType() === ResultsetStub.ContentType_BYTES.JSON;
        },

        /**
         * Checks if the value of the type protobuf message field matches the value used for signed integers.
         * @private
         * @function
         * @name module:ColumnMetadata#isSigned
         * @returns {string}
         */
        isSigned () {
            return proto.getType() === ResultsetStub.ColumnMetaData.FieldType.SINT;
        }
    };
}

ColumnMetadata.ColumnType = ColumnType;

module.exports = ColumnMetadata;
