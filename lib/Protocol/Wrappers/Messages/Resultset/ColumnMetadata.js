/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const ResultsetStub = require('../../../Stubs/mysqlx_resultset_pb');
const ServerMessagesStub = require('../../../Stubs/mysqlx_pb').ServerMessages;
const collations = require('../../../collations.json');
const bytes = require('../../ScalarValues/bytes');
const wraps = require('../../Traits/Wraps');

/**
 * API Column types as described by [MY-130]{@tutorial Working_with_Tables}.
 * @private
 * @readonly
 * @name ColumnType
 * @enum {string}
 */
const COLUMN_TYPE = {
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
    const isBinary = collation === collations.find(({ charset }) => charset === 'binary').id;

    if (contentType === ResultsetStub.ContentType_BYTES.JSON) {
        return COLUMN_TYPE.JSON;
    }

    if (contentType === ResultsetStub.ContentType_BYTES.GEOMETRY) {
        return COLUMN_TYPE.GEOMETRY;
    }

    if (!isBinary) {
        return COLUMN_TYPE.STRING;
    }

    return COLUMN_TYPE.BYTES;
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
        return COLUMN_TYPE.DATE;
    }

    if (!isTimestamp) {
        return COLUMN_TYPE.DATETIME;
    }

    return COLUMN_TYPE.TIMESTAMP;
}

/**
 * Extract the type string for SQL DECIMAL values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {string}
 */
function columnAsDecimal (flags) {
    if (!isUnsignedType(flags)) {
        return COLUMN_TYPE.DECIMAL;
    }

    return `UNSIGNED ${COLUMN_TYPE.DECIMAL}`;
}

/**
 * Extract the type string for SQL DOUBLE values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {string}
 */
function columnAsDouble (flags) {
    if (!isUnsignedType(flags)) {
        return COLUMN_TYPE.DOUBLE;
    }

    return `UNSIGNED ${COLUMN_TYPE.DOUBLE}`;
}

/**
 * Extract the type string for SQL FLOAT values.
 * @private
 * @param {number} [flags] - the column flag set encoded as a decimal number
 * @returns {Type}
 */
function columnAsFloat (flags) {
    if (!isUnsignedType(flags)) {
        return COLUMN_TYPE.FLOAT;
    }

    return `UNSIGNED ${COLUMN_TYPE.FLOAT}`;
}

/**
 * Extract the type string for SQL *INT values.
 * @private
 * @param {number} [size] - the column size
 * @returns {Type}
 */
function columnAsInteger (size) {
    if (size >= 20) {
        return COLUMN_TYPE.BIGINT;
    }

    if (size >= 10) {
        return COLUMN_TYPE.INT;
    }

    if (size >= 8) {
        return COLUMN_TYPE.MEDIUMINT;
    }

    if (size >= 5) {
        return COLUMN_TYPE.SMALLINT;
    }

    return COLUMN_TYPE.TINYINT;
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
 * @alias module:adapters.Mysqlx.Resultset.ColumnMetadataMetadata
 * @param {proto.Mysqlx.Resultset.ColumnMetaData} proto - protobuf stub
 * @returns {adapters.Mysqlx.Resultset.ColumnMetadataMetadata}
 */
function ColumnMetadata (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Returns the protobuf message name field.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getAlias
         * @returns {string}
         */
        getAlias () {
            return bytes(proto.getName()).toString();
        },

        /**
         * Returns the protobuf message catalog field.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getCatalog
         * @returns {string}
         */
        getCatalog () {
            return bytes(proto.getCatalog()).toString();
        },

        /**
         * Returns the character set name of the respective collation id.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getCharset
         * @returns {string}
         */
        getCharset () {
            if (!proto.hasCollation()) {
                return;
            }

            // In X Protocol, the charset is either utf8mb4 or binary.
            return collations.find(({ id }) => id === proto.getCollation()).charset;
        },

        /**
         * Returns the collation name of the respective collation id.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getCollation
         * @returns {string}
         */
        getCollation () {
            if (!proto.hasCollation()) {
                return;
            }

            return collations.find(({ id }) => id === proto.getCollation()).name;
        },

        /**
         * Returns the name of the column Content-Type
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getContentType
         * @returns {string}
         */
        getContentType () {
            const values = ResultsetStub.ContentType_BYTES;

            return Object.keys(values)
                .filter(k => values[k] === proto.getContentType())[0];
        },

        /**
         * Returns the value of the fractionalDigits protobuf message field.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getFractionalDigits
         * @returns {number}
         */
        getFractionalDigits () {
            return proto.getFractionalDigits();
        },

        /**
         * Returns the value of the length protobuf message field.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getLength
         * @returns {number}
         */
        getLength () {
            return proto.getLength();
        },

        /**
         * Returns the value of the originalName protobuf message field converted to a utf8 string.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getName
         * @returns {string}
         */
        getName () {
            return bytes(proto.getOriginalName()).toString();
        },

        /**
         * Returns the value of the schema protobuf message field encoded as an utf8 string.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getSchema
         * @returns {string}
         */
        getSchema () {
            return bytes(proto.getSchema()).toString();
        },

        /**
         * Returns the value of the table protobuf message field encoded as an utf8 string.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getTableAlias
         * @returns {string}
         */
        getTableAlias () {
            return bytes(proto.getTable()).toString();
        },

        /**
         * Returns the value of the originalTable protobuf message field encoded as an utf8 string.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getTableName
         * @returns {string}
         */
        getTableName () {
            return bytes(proto.getOriginalTable()).toString();
        },

        /**
         * Returns the type name of the underlying protocol message.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(ResultsetStub.ColumnMetaData.FieldType)
                .filter(k => ResultsetStub.ColumnMetaData.FieldType[k] === proto.getType())[0];
        },

        /**
         * Returns the type of the underlying protocol message.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getTypeId
         * @returns {number}
         */
        getTypeId () {
            return proto.getType();
        },

        /**
         * Decodes the type string of the column using its type id.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#getTypeString
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
                return COLUMN_TYPE.TIME;
            case ResultsetStub.ColumnMetaData.FieldType.DATETIME:
                return columnAsDateAndTime(proto.getContentType(), proto.getFlags());
            case ResultsetStub.ColumnMetaData.FieldType.SET:
                return COLUMN_TYPE.SET;
            case ResultsetStub.ColumnMetaData.FieldType.ENUM:
                return COLUMN_TYPE.ENUM;
            case ResultsetStub.ColumnMetaData.FieldType.BIT:
                return COLUMN_TYPE.BIT;
            case ResultsetStub.ColumnMetaData.FieldType.DECIMAL:
                return columnAsDecimal(proto.getFlags());
            }
        },

        /**
         * Checks if the column represents binary content.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#isBinary
         * @returns {boolean}
         */
        isBinary () {
            // TODO(Rui): not sure how to actually handle GEOMETRY values, so let's handle them as binary content for now
            return (!proto.hasContentType() && this.getCharset() === 'binary') ||
                proto.getContentType() === ResultsetStub.ContentType_BYTES.GEOMETRY;
        },

        /**
         * Checks if the value of the flags protobuf message field indicates type-specific behaviour.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#isFlagged
         * @returns {string}
         */
        isFlagged () {
            return !!(proto.getFlags() & 1);
        },

        /**
         * Checks if the content type of the column is JSON.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#isJSON
         * @returns {boolean}
         */
        isJSON () {
            return proto.getContentType() === ResultsetStub.ContentType_BYTES.JSON;
        },

        /**
         * Checks if the value of the type protobuf message field matches the value used for signed integers.
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#isSigned
         * @returns {string}
         */
        isSigned () {
            return proto.getType() === ResultsetStub.ColumnMetaData.FieldType.SINT;
        },

        /**
         * Returns a JSON representation with utf8-encoded properties (to be used by JSON.stringify).
         * @function
         * @name module:adapters.Mysqlx.Resultset.ColumnMetadata#toJSON
         * @returns {Object}
         */
        toJSON () {
            return {
                type: this.getType(),
                name: this.getAlias(),
                original_name: this.getName(),
                table: this.getTableAlias(),
                original_table: this.getTableName(),
                schema: this.getSchema(),
                catalog: this.getCatalog(),
                collation: proto.getCollation(),
                fractional_digits: proto.getFractionalDigits(),
                length: proto.getLength(),
                flags: proto.getFlags(),
                content_type: this.getContentType()
            };
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Resultset.ColumnMetadata}
 */
ColumnMetadata.deserialize = function (buffer) {
    return ColumnMetadata(ResultsetStub.ColumnMetaData.deserializeBinary(bytes.deserialize(buffer)));
};

ColumnMetadata.COLUMN_TYPE = COLUMN_TYPE;
ColumnMetadata.MESSAGE_ID = ServerMessagesStub.Type.RESULTSET_COLUMN_META_DATA;

module.exports = ColumnMetadata;
