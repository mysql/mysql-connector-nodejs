/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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

const IntegerType = require('../../ScalarValues/int64').Type;
const JSON = require('../../../../json');
const ResultsetStub = require('../../../Stubs/mysqlx_resultset_pb');
const ServerMessagesStub = require('../../../Stubs/mysqlx_pb').ServerMessages;
const bytes = require('../../ScalarValues/bytes');
const errors = require('../../../../constants/errors');
const jspb = require('google-protobuf');
const sint64 = require('../../ScalarValues/sint64');
const uint64 = require('../../ScalarValues/uint64');
const util = require('util');
const wraps = require('../../Traits/Wraps');

/**
 * Known max values for some specific data types.
 * @private
 * @readonly
 * @name MAX_DATATYPE_SIZE
 * @enum {number}
 */
const MAX_DATATYPE_SIZE = {
    DATETIME: 8,
    TIME: 5
};

/**
 * Decode a column value encoded using X Protocol BIT.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @returns {string} A string containing the decimal value (to avoid loosing precision).
 */
function decodeBitSequence (reader) {
    return reader.readPackedUint64String()[0];
}

/**
 * Decode a column value encoded using X Protocol DATETIME or TIMESTAMP.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @returns {Date|number} A JavaScript date (DATETIME) or number (TIMESTAMP).
 */
function decodeDatetime (reader, { isTimestamp, maxSize = MAX_DATATYPE_SIZE.DATETIME } = {}) {
    return formatDatetime(decodeTemporalValue(reader, { maxSize }), { isTimestamp });
}

/**
 * Decode a column value encoded using X Protocol DECIMAL.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @returns {number|string} A JavaScript number or string (to avoid loosing precision) containing the decimal value.
 */
function decodeDecimal (reader) {
    const data = bytes(reader.readBytes()).toBuffer();

    // scale is always a positive value, so we should assume its an unsigned int
    const scale = data.readUInt8(0);

    // read the remaining sequence (in hex to make it easier to operate on 4 bit segments)
    const remaining = data.slice(1).toString('hex');

    let lastFourBits = remaining.charAt(remaining.length - 1).toLowerCase();
    let bcd;

    if (lastFourBits !== '0') {
        // the last character should be the sign
        bcd = remaining.slice(0, remaining.length - 1);
    } else {
        // the last character should be the extra 4 bit zeroed padding
        bcd = remaining.slice(0, remaining.length - 2);
        lastFourBits = remaining.charAt(remaining.length - 2).toLowerCase();
    }

    const sign = lastFourBits === 'c' ? '+' : '-';
    const int = bcd.slice(0, bcd.length - scale);
    const decimal = bcd.slice(bcd.length - scale);

    if (!decimal.length) {
        return formatSafeNumber(`${sign}${int}`);
    }

    return formatSafeNumber(`${sign}${int}.${decimal}`);
}

/**
 * Decode a column value encoded using X Protocol DOUBLE.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @param {number} [fractionalDigits] - The number of fractional digits to
 * ensure.
 * @returns {number} A JavaScript number.
 */
function decodeDouble (reader, { fractionalDigits }) {
    const [decimal] = reader.readPackedDouble();

    return formatDecimal(decimal, { fractionalDigits });
}

/**
 * Decode a column value encoded using X Protocol FLOAT.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @param {number} [fractionalDigits] - The number of fractional digits to
 * ensure.
 * @returns {number} A JavaScript number.
 */
function decodeFloat (reader, { fractionalDigits }) {
    const [decimal] = reader.readPackedFloat();

    return formatDecimal(decimal, { fractionalDigits });
}

/**
 * Decode a column value encoded using X Protocol BYTES.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @param {boolean} [isBinary] - A flag that determines if the value should
 * be decoded as an opaque byte sequence.
 * @param {boolean} [isJSON] - A flag that determines if the value should
 * be decoded as a plain JavaScript object.
 * @param {number} [padding] - The padding to apply at the end.
 * @returns {string|Buffer} A JavaScript string (textual data) or a Node.js Buffer (binary data).
 */
function decodeOpaqueByteString (reader, { integerType, isBinary = false, isJSON = false, padding = 0, length = 0 } = {}) {
    // If the column value is empty, it is a NULL.
    if (!length) {
        return null;
    }

    // Binary colum datatypes: BINARY, VARBINARY, BLOB, TINYBLOB, MEDIUMBLOB,
    // LONGBLOB.
    // When BINARY values are stored, they are right-padded with 0x00 to the
    // specified length. So, the client does not need to add any padding.
    // For BLOB columns there is no padding on insert and the client also
    // does not need to add any padding.
    // https://dev.mysql.com/doc/refman/8.0/en/binary-varbinary.html
    // https://dev.mysql.com/doc/refman/8.0/en/blob.html
    if (isBinary) {
        const binary = reader.readBytes();
        // remove the extra '\0' defined by the protocol
        return bytes(binary.subarray(0, binary.byteLength - 1)).toBuffer();
    }

    // At this point, we are dealing with a textual column data type instead
    // of a binary data type.
    let data = reader.readString();

    // Textual colum datatypes: JSON, XML, CHAR, VARCHAR, TEXT, TINYTEXT,
    // MEDIUMTEXT, LONGTEXT.
    // Unlike BINARY values, when CHAR values are stored, they are not
    // right-padded with '\0' to the specified length.
    // So, the client should add the corresponding padding characters.
    // There is still an extra '\0' defined by the protocol that can be
    // removed beforehand.
    // For TEXT columns there is no padding on insert and the client also
    // does not need to add any padding.
    data = data.substring(0, data.length - 1).padEnd(padding, ' ');

    // If the column data type is not JSON, it means it is one of the
    // remaining textual values and there is nothing left to do.
    if (!isJSON) {
        return data;
    }

    // If the column data type is JSON, since this is JavaScript, we can
    // convert it to a plain object for convenience.
    switch (integerType) {
    case IntegerType.BIGINT:
        // TODO(Rui): BigInt does not work for decimal numbers, so we probably
        // need a new worklog to customize the return type.
        // For now, we always convert unsafe decimals to a string.
        return JSON({ anyIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(data);
    case IntegerType.UNSAFE_BIGINT:
        return JSON({ unsafeIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(data);
    case IntegerType.STRING:
        return JSON({ anyNumberAsString: true }).parse(data);
    case IntegerType.UNSAFE_STRING:
        return JSON({ unsafeNumberAsString: true }).parse(data);
    default:
        return JSON().parse(data);
    }
}

/**
 * Decode a column value encoded using X Protocol SET.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @returns {string[]} A JavaScript array of JavaScript strings.
 */
function decodeSet (reader) {
    // A set should be an array of strings.
    const group = [];
    // A set is represented by a sequence of length-prepended octets.
    // More details available at the mysqlx_resultset.proto definition.
    const bytes = reader.readBytes();

    // If the byte sequence does not have a length, it means the column value
    // is NULL.
    if (!bytes) {
        return null;
    }

    // If the byte sequence has a length higher than 0 and contains less than
    // 2 octets, it is invalid but should be treated as an empty set.
    if (bytes[0] > 0x00 && bytes.byteLength < 2) {
        return group;
    }

    // Otherwise, it means the byte sequence is valid and contains sequences
    // of one or more length-prepended octets, thus we need to restart the
    // cursor to iterate over the whole sequence.
    reader.reset();

    // We are only interested in one field, but there is no need to ensure
    // it exists, so we do it within a loop.
    while (reader.nextField()) {
        // The field itself contains an inner byte sequence of
        // length-prepended strings, so we need to iterate over
        // it using an appropriate decoder.
        const innerDecoder = reader.getFieldDecoder();

        while (!innerDecoder.atEnd()) {
            group.push(innerDecoder.readStringWithLength());
        }

        innerDecoder.free();
    }

    return group;
}

/**
 * Decode a column value encoded using X Protocol SINT.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * @param {int64.Type} [type] - The conversion mode selected by the
 * application to handle downstream integer values in the current session.
 * @returns {number|string|BigInt} A JavaScript number, string or BigInt
 * depending on the value of "integerType".
 */
function decodeSignedInt (reader, { type }) {
    const [signedIntString] = reader.readPackedSint64String();
    return sint64.deserialize(signedIntString, { type });
}

/**
 * Decode a column value encoded using X Protocol TIME.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @returns {string} A JavaScript string containting the time representation.
 */
function decodeTime (reader) {
    // TIME values correspond to time differences, which means they must
    // include a sign that tells if the value is positive or negative.
    return formatTime(decodeTemporalValue(reader, { maxSize: MAX_DATATYPE_SIZE.TIME }), { signed: true });
}

/**
 * Decode a column value encoded using X Protocol TIME, DATE, DATETIME or TIMESTAMP.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @param {number} [maxSize] - The maximum allowed size (in bytes) for the
 * given column data type (TIME, DATE, DATETIME or TIMESTAMP).
 * @returns {number[]} A JavaScript array encoding the temporal representation.
 */
function decodeTemporalValue (reader, { maxSize = 0 } = {}) {
    // In order to ensure the data type value is properly represented in
    // memory, a Buffer is created with the maximum size (in bytes) of the
    // corresponding column data type.
    const startingPoint = Buffer.alloc(maxSize);
    // We will use the underlying TypedArray that references the memory
    // to copy the values from the reader.
    const value = startingPoint.toJSON().data;
    // An inner decoder is needed to iterate through the length-preceding
    // octets in the byte sequence.
    const innerDecoder = reader.getFieldDecoder();

    let i = 0;

    while (!innerDecoder.atEnd()) {
        // There is precision loss, since the maximum value is 999999
        // (useconds), so we can decode the value as a number.
        value[i++] = innerDecoder.readUnsignedVarint64();
    }

    innerDecoder.free();

    return value;
}

/**
 * Decode a column value encoded using X Protocol UINT.
 * @private
 * @param {jspb.BinaryReader} reader - An iterator over the raw protobuf byte
 * sequence.
 * @param {int64.Type} [integerType] - The conversion mode selected by the
 * application to handle downstream integer values in the current session.
 * @param {number} [padding] - The padding to apply from the start, when
 * the output is a string.
 * @returns {number|string|BigInt} A JavaScript number, string (zerofilled) or
 * BigInt depending on the value of "integerType".
 */
function decodeUnsignedInt (reader, { type, padding = 0 } = {}) {
    const [unsignedIntString] = reader.readPackedUint64String();
    const unsignedInt = uint64.deserialize(unsignedIntString, { type });

    if (typeof unsignedInt !== 'string') {
        return unsignedInt;
    }

    // the number should always be converted to a string (unsafe or not)
    return unsignedIntString.padStart(padding, '0');
}

/**
 * Format the output of a JavaScript number to avoid loosing precision.
 * @private
 * @param {string} value - string containing a numeric value
 * @returns {number|string} A JavaScript string (when there is overflow) or number.
 */
function formatSafeNumber (value) {
    const matcher = value.match(/(\d+)\.?(\d+)?$/) || [];
    const int = matcher[1];
    const decimal = matcher[2];

    // JavaScript number is represented in 64-bit format IEEE-754, so there
    // are exactly 64 bits to store a number: 52 of them are used to store the
    // digits, 11 of them store the position of the decimal point, and 1 bit
    // is for the sign.
    let isUnsafe = false;

    if (!decimal) {
        // If the decimal part does not exist, we only need to worry about
        // integer precision.
        isUnsafe = BigInt(int) > Number.MAX_SAFE_INTEGER || BigInt(int) < Number.MIN_SAFE_INTEGER;
    } else {
        // If the decimal part exists, we can check if the number is safe is by
        // comparing the original raw string with the string resulting from
        // calling "toFixed()" using the number of decimal digits.
        isUnsafe = `${int}.${decimal}` !== Number.parseFloat(`${int}.${decimal}`)
            .toFixed(decimal.length);
    }

    // If the value is unsafe, we should not convert it to a JavaScript number
    // because we might be loosing precision.
    if (isUnsafe) {
        // Any initial "+" sign should not be part of the string.
        return value.replace('+', '');
    }

    return Number.parseFloat(value);
}

/**
 * Format a temporal value encoded as an array.
 * @private
 * @param {number[]} temporal
 * @param {boolean} [isTimestamp] - A flag that indicates if the output
 * should be a Unix timestamp.
 * @returns {string} A JavaScript string containing the time representation.
 */
function formatDatetime (temporal, { isTimestamp = false } = {}) {
    const year = temporal[0].toString().padStart(4, '0');
    const month = temporal[1].toString().padStart(2, '0');
    const day = temporal[2].toString().padStart(2, '0');

    const timeSlice = temporal.slice(2, temporal.length);
    // DATETIME or TIMESTAMP values are always positive.
    const time = formatTime(timeSlice);

    const date = new Date(`${year}-${month}-${day}T${time}Z`);

    if (isTimestamp) {
        // should be a timestamp
        return date.getTime();
    }

    return date;
}

/**
 * Apply a rounding mask to a decimal value according to the metadata definition.
 * @private
 * @param {number} value - A JavaScript number containing a float value.
 * @param {number} [fractionalDigits] - The number of fractional digits to
 * ensure.
 * @returns {number} The masked JavaScript number.
 */
function formatDecimal (value, { fractionalDigits = 0 } = {}) {
    // number of decimal digits
    fractionalDigits = fractionalDigits || value.toPrecision().slice(Math.floor(value).toString().length + 1).length;

    return Math.round(value * Math.pow(10, fractionalDigits)) / Math.pow(10, fractionalDigits);
}

/**
 * Format a temporal value encoded as an array.
 * @private
 * @param {number[]} temporal
 * @param {signed} [boolean] - A flag that determines if the time difference
 * should contain a positive or negative sign.
 * @returns {string} A JavaScript string containing the time representation.
 */
function formatTime (temporal, { signed = false } = {}) {
    const hour = temporal[1].toString().padStart(2, '0');
    const minutes = temporal[2].toString().padStart(2, '0');
    const seconds = temporal[3].toString().padStart(2, '0');
    const useconds = temporal[4].toString().padStart(6, '0');

    const time = `${hour}:${minutes}:${seconds}.${useconds}`;

    // DATETIME and TIMESTAMP values are always positive.
    if (!signed) {
        return time;
    }

    // TIME values are can be negative, so they should include a sign.
    const negate = temporal[0] > 0 ? '-' : '+';

    return `${negate}${time}`;
}

/**
 * Decode a column value for each Mysqlx.Resultset.Row.
 * @private
 * @param {Uint8Array} field - The raw byte sequence contained in the protobuf.
 * @param {Object} [options] - object containing the column metadata
 * @returns {*} - A native JavaScript type.
 */
function decodeField (field, options) {
    let data;

    const { column, integerType } = options;

    if (!column) {
        throw new Error(errors.MESSAGES.ER_X_CLIENT_NO_COLUMN_METADATA);
    }

    // Empty field values match to NULL.
    if (!field.length) {
        return null;
    }

    const writer = new jspb.BinaryWriter();
    writer.writeBytes(1, field);

    const reader = jspb.BinaryReader.alloc(writer.getResultBuffer());

    // Start cursor (currently at -1, which does not match any valid WireType).
    if (!reader.nextField()) {
        throw new Error(util.format(errors.MESSAGES.ER_X_CLIENT_BAD_PROTOBUF_MESSAGE, 'Mysqlx.Resultset.Row.field'));
    }

    const type = column.getTypeId();

    if (type === ResultsetStub.ColumnMetaData.FieldType.FLOAT) {
        data = decodeFloat(reader, { fractionalDigits: column.getFractionalDigits() });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DOUBLE) {
        data = decodeDouble(reader, { fractionalDigits: column.getFractionalDigits() });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.SINT) {
        data = decodeSignedInt(reader, { type: integerType });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.UINT) {
        data = decodeUnsignedInt(reader, { type: integerType, padding: column.isFlagged() && column.getLength() });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.BIT) {
        data = decodeBitSequence(reader);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.BYTES || type === ResultsetStub.ColumnMetaData.FieldType.ENUM) {
        data = decodeOpaqueByteString(reader, { integerType, isBinary: column.isBinary(), isJSON: column.isJSON(), length: field.length, padding: column.isFlagged() && column.getLength() });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.TIME) {
        data = decodeTime(reader);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DATETIME) {
        data = decodeDatetime(reader, { isTimestamp: column.isFlagged() });
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DECIMAL) {
        data = decodeDecimal(reader);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.SET) {
        data = decodeSet(reader);
    } else {
        throw new Error(util.format(errors.MESSAGES.ER_X_CLIENT_BAD_PROTOBUF_MESSAGE, 'Mysqlx.Resultset.ColumnMetaData.type'));
    }

    reader.free();

    return data;
}

/**
 * @private
 * @alias module:adapters.Mysqlx.Resultset.Row
 * @param {proto.Mysqlx.Resultset.Row} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Resultset.Row}
 */
function Row (proto, options) {
    const state = Object.assign({}, { metadata: [] }, options);

    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the column metadata associated to the given row.
         * @private
         * @function
         * @name module:adapters.Mysqlx.Resultset.Row#getColumnMetadata
         * @returns {Array<module:adapters.Mysqlx.Resultset.ColumnMetadata>} The array of column metadata type instances.
         */
        getColumnMetadata () {
            return state.metadata;
        },

        /**
         * Set the column metadata for the current row.
         * @private
         * @function
         * @name module:adapters.Mysqlx.Resultset.Row#setColumnMetadata
         * @returns {module:adapters.Mysqlx.Resultset.Row} The Row instance.
         */
        setColumnMetadata (metadata) {
            state.metadata = metadata;
            return this;
        },

        /**
         * Decode the binary content of every field in the row.
         * @private
         * @function
         * @name module:adapters.Mysqlx.Resultset.Row#toArray
         * @returns {Array<*>} An array of native JavaScript values.
         */
        toArray ({ integerType } = {}) {
            return proto.getFieldList()
                .map((field, index) => decodeField(field, { column: state.metadata[index], integerType }));
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @private
         * @function
         * @name module:adapters.Mysqlx.Resultset.Row#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            // The log should contain a JSON string, not a plain JavaScript
            // object, so we can convert all integers to BigInt safely, because
            // the values will be injected as is in the resulting JSON string.
            return { fields: this.toArray({ integerType: IntegerType.BIGINT }) };
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Resultset.Row}
 */
Row.deserialize = function (buffer) {
    return Row(ResultsetStub.Row.deserializeBinary(bytes.deserialize(buffer)));
};

Row.MESSAGE_ID = ServerMessagesStub.Type.RESULTSET_ROW;

module.exports = Row;
