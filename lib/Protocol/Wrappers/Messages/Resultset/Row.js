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

const ResultsetStub = require('../../../Stubs/mysqlx_resultset_pb');
const ServerMessagesStub = require('../../../Stubs/mysqlx_pb').ServerMessages;
const bytes = require('../../ScalarValues/bytes');
const jspb = require('google-protobuf');
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
 * @param {jspb.BinaryDecoder} decoder
 * @returns {string} A string containing the decimal value (to avoid loosing precision).
 */
function decodeBitSequence (decoder) {
    return decoder.readUnsignedVarint64String();
}

/**
 * Decode a column value encoded using X Protocol DATETIME or TIMESTAMP.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {Object} [options] - object containing the column metadata
 * @returns {Date|number} A JavaScript date (DATETIME) or number (TIMESTAMP).
 */
function decodeDatetime (decoder, options) {
    options = Object.assign({ maxSize: MAX_DATATYPE_SIZE.DATETIME }, options);

    return formatDatetime(decodeTemporalValue(decoder, options), options);
}

/**
 * Decode a column value encoded using X Protocol DECIMAL.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript number or string (to avoid loosing precision) containing the decimal value.
 */
function decodeDecimal (decoder, options) {
    const data = bytes(decoder.readBytes(options.length)).toBuffer();

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
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {number} A JavaScript number.
 */
function decodeDouble (decoder, options) {
    return formatDecimal(decoder.readDouble(), options);
}

/**
 * Decode a column value encoded using X Protocol FLOAT.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {number} A JavaScript number.
 */
function decodeFloat (decoder, options) {
    return formatDecimal(decoder.readFloat(), options);
}

/**
* Decode a column value encoded using X Protocol BYTES.
* @private
* @param {jspb.BinaryDecoder} decoder
* @param {options} [options] - object containing the column metadata
* @returns {string|Buffer} A JavaScript string (textual data) or a Node.js Buffer (binary data).
*/
function decodeOpaqueByteString (decoder, options) {
    // XML should be equivalent to plain text.
    options = Object.assign({}, options);

    if (!options.length) {
        return null;
    }

    if (options.column.isBinary()) {
        // remove the extra '\0' defined by the protocol
        const data = bytes(decoder.readBytes(options.length - 1)).toBuffer();

        if (options.column.isFlagged()) {
            return rightPad(data, options.column.getLength(), '\0');
        }

        return data;
    }

    // remove the extra '\0' defined by the protocol
    let data = decoder.readString(options.length - 1);

    if (options.column.isFlagged()) {
        data = rightPad(data, options.column.getLength(), ' ');
    }

    if (!options.column.isJSON()) {
        return data;
    }

    return JSON.parse(data);
}

/**
 * Decode a column value encoded using X Protocol SET.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {string[]} A JavaScript array of JavaScript strings.
 */
function decodeSet (decoder, options) {
    let group = [];

    // Sequence format is defined in the mysqlx_resultset.proto definition
    // [0] - the NULL value
    if (decoder.atEnd()) {
        return null;
    }

    const beginning = decoder.getCursor();

    const firstByte = bytes(decoder.readBytes(1)).toBuffer();

    // [1] 0x00 - a set containing a blank string ''
    if (firstByte.toString('hex') === '00') {
        return group.concat('');
    }

    // [1] 0x01 - this would be an invalid value, but is to be treated as the empty set
    if (firstByte.toString('hex') === '01' && decoder.atEnd()) {
        return group;
    }

    const secondByte = bytes(decoder.readBytes(1)).toBuffer();

    // [2] 0x01 0x00 - a set with a single item, which is the '\0' character
    if (firstByte.toString('hex') === '01' && secondByte.toString('hex') === '00') {
        return group.concat('\0');
    }

    // We need read the whole sequence so we must restart the cursor (it is
    // partially consumed by this point).
    decoder.setCursor(beginning);

    while (!decoder.atEnd()) {
        // [8] 0x03 F O O 0x03 B A R - a set with 2 items: FOO,BAR
        group = group.concat(decoder.readStringWithLength());
    }

    return group;
}

/**
 * Decode a column value encoded using X Protocol SINT.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript number or string (to avoid loosing precision) containing the decimal value.
 */
function decodeSignedInt (decoder, options) {
    const beginning = decoder.getCursor();
    // let's start by trying to decode the value as a JavaScript number
    const signedInt = decoder.readZigzagVarint64();

    // if there is no chance of losing precision, we can proceed
    if (signedInt >= Number.MIN_SAFE_INTEGER && signedInt <= Number.MAX_SAFE_INTEGER) {
        return signedInt;
    }

    // otherwise, we need to go back and decode it as string
    decoder.setCursor(beginning);

    return decoder.readZigzagVarint64String();
}

/**
 * Decode a column value encoded using X Protocol TIME.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {string} A JavaScript string containting the time representation.
 */
function decodeTime (decoder, options) {
    options = Object.assign({ maxSize: MAX_DATATYPE_SIZE.TIME }, options);

    return formatTime(decodeTemporalValue(decoder, options));
}

/**
 * Decode a column value encoded using X Protocol TIME, DATE, DATETIME or TIMESTAMP.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing internal implementation details
 * @returns {number[]} A JavaScript array encoding the temporal representation.
 */
function decodeTemporalValue (decoder, options) {
    options = Object.assign({ maxSize: 0 }, options);

    // eslint-disable-next-line node/no-deprecated-api
    const startingPoint = new Buffer(options.maxSize);
    startingPoint.fill(0);

    const value = startingPoint.toJSON().data;

    let i = 0;

    while (!decoder.atEnd()) {
        // No precision loss, since the maximum value is 999999 (useconds).
        value[i++] = decoder.readUnsignedVarint64();
    }

    return value;
}

/**
 * Decode a column value encoded using X Protocol UINT.
 * @private
 * @param {jspb.BinaryDecoder} decoder
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript string (when there is overflow or zerofill) or number.
 */
function decodeUnsignedInt (decoder, options) {
    const uint = formatSafeNumber(decoder.readUnsignedVarint64String());

    if (!options.column.isFlagged()) {
        return uint;
    }

    return leftPad(uint, options.column.getLength(), '0');
}

/**
 * Format the output of a JavaScript number to avoid loosing precision.
 * @private
 * @param {string} value - string containing a numeric value
 * @returns {number|string} A JavaScript string (when there is overflow) or number.
 */
function formatSafeNumber (value) {
    const num = parseFloat(value);

    if (num < Number.MIN_SAFE_INTEGER || num > Number.MAX_SAFE_INTEGER) {
        return value;
    }

    return num;
}

/**
 * Format a temporal value encoded as an array.
 * @private
 * @param {number[]} temporal
 * @param {options} [options] - object containing internal implementation details
 * @returns {string} A JavaScript string containing the time representation.
 */
function formatDatetime (temporal, options) {
    const year = leftPad(temporal[0], 4, '0');
    const month = leftPad(temporal[1], 2, '0');
    const day = leftPad(temporal[2], 2, '0');

    const timeSlice = temporal.slice(2, temporal.length);
    const time = formatTime(timeSlice, { signed: false });

    const date = new Date(`${year}-${month}-${day}T${time}Z`);

    if (options.column.isFlagged()) {
        // should be a timestamp
        return date.getTime();
    }

    return date;
}

/**
 * Apply a rounding mask to a decimal value according to the metadata definition.
 * @private
 * @param {number} value - JavaScript number
 * @param {options} [options] - object containing the column metadata
 * @returns {number} The masked JavaScript number.
 */
function formatDecimal (value, options) {
    // number of decimal digits
    const fractionalDigits = options.column.getFractionalDigits() || value.toPrecision().slice(Math.floor(value).toString().length + 1).length;

    return Math.round(value * Math.pow(10, fractionalDigits)) / Math.pow(10, fractionalDigits);
}

/**
 * Format a temporal value encoded as an array.
 * @private
 * @param {number[]} temporal
 * @param {options} [options] - object containing internal implementation details
 * @returns {string} A JavaScript string containing the time representation.
 */
function formatTime (temporal, options) {
    options = Object.assign({ signed: true }, options);

    const hour = leftPad(temporal[1], 2, '0');
    const minutes = leftPad(temporal[2], 2, '0');
    const seconds = leftPad(temporal[3], 2, '0');
    const useconds = leftPad(temporal[4], 6, '0');

    const time = `${hour}:${minutes}:${seconds}.${useconds}`;

    if (!options.signed) {
        return time;
    }

    const negate = temporal[0] > 0 ? '-' : '+';

    return `${negate}${time}`;
}

/**
 * Left pad a value with a given length.
 * @private
 * @param {Buffer|number|string} value - value to pad
 * @param {number} [size] - expected output size
 * @param {string} [char] - filler character
 * @returns {string} The left-padded JavaScript string or Node.js Buffer.
 */
function leftPad (value, size, char) {
    char = char || ' ';

    if (Buffer.isBuffer(value)) {
        if (!size || size <= value.length) {
            return value;
        }

        // eslint-disable-next-line node/no-deprecated-api
        const padding = new Buffer(size - value.length);
        padding.fill(0);

        return Buffer.concat([padding, value], padding.length + value.length);
    }

    const asString = value.toString();
    const maxSize = value.toString().length;

    if (!size || size <= maxSize) {
        return asString;
    }

    return char.repeat(size - maxSize).concat(asString);
}

/**
 * Right pad a value with a length.
 * @private
 * @param {Buffer|number|string} value - value to pad
 * @param {number} [size] - expected output size
 * @param {string} [char] - filler character
 * @returns {string} The right-padded JavaScript string or Node.js Buffer.
 */
function rightPad (value, size, char) {
    char = char || ' ';

    if (Buffer.isBuffer(value)) {
        if (!size || size <= value.length) {
            return value;
        }

        // eslint-disable-next-line node/no-deprecated-api
        const padding = new Buffer(size - value.length);
        padding.fill(0);

        return Buffer.concat([value, padding], value.length + padding.length);
    }

    const asString = value.toString();
    const maxSize = value.toString().length;

    if (!size || size <= maxSize) {
        return asString;
    }

    return asString.concat(char.repeat(size - maxSize));
}

/**
 * Decode a column value for each Mysqlx.Resultset.Row.
 * @private
 * @param {Uint8Array} field - Protocol Buffers `bytes` type.
 * @param {Object} [options] - object containing the column metadata
 * @returns {*} - A native JavaScript type.
 */
function decodeField (field, options) {
    let data;

    if (!options.column) {
        throw new Error('There is no metadata available for the given column.');
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
        throw new Error('Invalid value for Mysqlx.Resultset.Row.field');
    }

    const decoder = reader.getFieldDecoder();
    const type = options.column.getTypeId();

    if (type === ResultsetStub.ColumnMetaData.FieldType.FLOAT) {
        data = decodeFloat(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DOUBLE) {
        data = decodeDouble(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.SINT) {
        data = decodeSignedInt(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.UINT) {
        data = decodeUnsignedInt(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.BIT) {
        data = decodeBitSequence(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.BYTES || type === ResultsetStub.ColumnMetaData.FieldType.ENUM) {
        data = decodeOpaqueByteString(decoder, Object.assign({}, { length: field.length }, options));
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.TIME) {
        data = decodeTime(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DATETIME) {
        data = decodeDatetime(decoder, options);
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.DECIMAL) {
        data = decodeDecimal(decoder, Object.assign({}, { length: field.length }, options));
    } else if (type === ResultsetStub.ColumnMetaData.FieldType.SET) {
        data = decodeSet(decoder, options);
    } else {
        throw new Error('Invalid value for Mysqlx.Resultset.ColumnMetaData.type');
    }

    decoder.free();
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
        toArray () {
            return proto.getFieldList()
                .map((field, index) => decodeField(field, { column: state.metadata[index] }));
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @private
         * @function
         * @name module:adapters.Mysqlx.Resultset.Row#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return { fields: this.toArray() };
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Resultset.Row}
 */
Row.deserialize = function (buffer) {
    return Row(ResultsetStub.Row.deserializeBinary(bytes.deserialize(buffer).valueOf()));
};

Row.MESSAGE_ID = ServerMessagesStub.Type.RESULTSET_ROW;

module.exports = Row;
