/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
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

/**
 * Resultset protobuf adapter.
 * @private
 * @module Resultset
 */

const BinaryReader = require('google-protobuf').BinaryReader;
const BinaryWriter = require('google-protobuf').BinaryWriter;
const ColumnMetaData = require('../Stubs/mysqlx_resultset_pb').ColumnMetaData;
const ContentType = require('../Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const FetchDone = require('../Stubs/mysqlx_resultset_pb').FetchDone;
const FetchDoneMoreOutParams = require('../Stubs/mysqlx_resultset_pb').FetchDoneMoreOutParams;
const FetchDoneMoreResultsets = require('../Stubs/mysqlx_resultset_pb').FetchDoneMoreResultsets;
const Row = require('../Stubs/mysqlx_resultset_pb').Row;
const collations = require('../../Collations');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Constants
 */
const MAX_DATETIME_SIZE = 8;
const MAX_TIME_SIZE = 5;

/**
 * Decode a column value encoded using X Protocol BIT.
 * @private
 * @param {BinaryReader} reader
 * @returns {string} A string containing the decimal value (to avoid loosing precision).
 */
function decodeBitSequence (reader) {
    return reader.getFieldDecoder().readUnsignedVarint64String();
}

/**
 * Decode a column value encoded using X Protocol DATETIME or TIMESTAMP.
 * @private
 * @param {BinaryReader} reader
 * @param {Object} [options] - object containing the column metadata
 * @returns {Date|number} A JavaScript date (DATETIME) or number (TIMESTAMP).
 */
function decodeDatetime (reader, options) {
    options = Object.assign({ maxSize: MAX_DATETIME_SIZE }, options);

    return formatDatetime(decodeTemporalValue(reader, options), options);
}

/**
 * Decode a column value encoded using X Protocol DECIMAL.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript number or string (to avoid loosing precision) containing the decimal value.
 */
function decodeDecimal (reader, options) {
    /* eslint-disable node/no-deprecated-api */
    const bytes = new Buffer(reader.readBytes());
    /* eslint-enable node/no-deprecated-api */

    // scale is always a positive value, so we should assume its an unsigned int
    const scale = bytes.readUInt8(0);

    // read the remaining sequence (in hex to make it easier to operate on 4 bit segments)
    const remaining = bytes.slice(1).toString('hex');

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
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {number} A JavaScript number.
 */
function decodeDouble (reader, options) {
    return formatDecimal(reader.getFieldDecoder().readDouble(), options);
}

/**
 * Decode a column value for each Mysqlx.Resultset.Row.
 * @private
 * @param {Uint8Array} field - Protocol Buffers `bytes` type.
 * @param {Object} [options] - object containing the column metadata
 * @returns {*} - A native JavaScript type.
 */
function decodeField (field, options) {
    if (!options.metadata) {
        throw new Error('There is no metadata available for the given column.');
    }

    // Empty field values match to NULL.
    if (!field.length) {
        return null;
    }

    const writer = new BinaryWriter();
    writer.writeBytes(1, field);

    const reader = BinaryReader.alloc(writer.getResultBuffer());

    // Start cursor (currently at -1, which does not match any valid WireType).
    if (!reader.nextField()) {
        throw new Error('Invalid value for Mysqlx.Resultset.Row.field');
    }

    switch (options.metadata.type) {
    case ColumnMetaData.FieldType.FLOAT:
        return decodeFloat(reader, options);
    case ColumnMetaData.FieldType.DOUBLE:
        return decodeDouble(reader, options);
    case ColumnMetaData.FieldType.SINT:
        return decodeSignedInt(reader, options);
    case ColumnMetaData.FieldType.UINT:
        return decodeUnsignedInt(reader, options);
    case ColumnMetaData.FieldType.BIT:
        return decodeBitSequence(reader, options);
    case ColumnMetaData.FieldType.BYTES:
    case ColumnMetaData.FieldType.ENUM:
        return decodeOpaqueByteString(reader, Object.assign({ length: field.length }, options));
    case ColumnMetaData.FieldType.TIME:
        return decodeTime(reader, options);
    case ColumnMetaData.FieldType.DATETIME:
        return decodeDatetime(reader, options);
    case ColumnMetaData.FieldType.DECIMAL:
        return decodeDecimal(reader, options);
    case ColumnMetaData.FieldType.SET:
        return decodeSet(reader, options);
    default:
        throw new Error('Invalid value for Mysqlx.Resultset.ColumnMetaData.type');
    }
}

/**
 * Decode a column value encoded using X Protocol FLOAT.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {number} A JavaScript number.
 */
function decodeFloat (reader, options) {
    return formatDecimal(reader.getFieldDecoder().readFloat(), options);
}

/**
 * Decode a column value encoded using X Protocol BYTES.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {string|Buffer} A JavaScript string (textual data) or a Node.js Buffer (binary data).
 */
function decodeOpaqueByteString (reader, options) {
    // XML should be equivalent to plain text.
    options = Object.assign({}, options);

    if (!options.length) {
        return null;
    }

    const charset = collations.find(options.metadata.collation).charset;

    // TODO(Rui): not sure how to actually handle GEOMETRY values, so let's handle them as binary content for now
    if ((!options.metadata.contentType && charset === 'binary') || options.metadata.contentType === ContentType.GEOMETRY) {
        // remove the extra '\0' defined by the protocol
        // eslint-disable-next-line node/no-deprecated-api
        const data = new Buffer(reader.getFieldDecoder().readBytes(options.length - 1));

        if (options.metadata.flags & 1) {
            return rightPad(data, options.metadata.length, '\0');
        }

        return data;
    }

    // remove the extra '\0' defined by the protocol
    let data = reader.getFieldDecoder().readString(options.length - 1);

    if (options.metadata.flags & 1) {
        data = rightPad(data, options.metadata.length, ' ');
    }

    if (options.metadata.contentType !== ContentType.JSON) {
        return data;
    }

    return JSON.parse(data);
}

/**
 * Decode a column value encoded using X Protocol SET.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {string[]} A JavaScript array of JavaScript strings.
 */
function decodeSet (reader, options) {
    const decoder = reader.getFieldDecoder();
    let group = [];

    if (decoder.atEnd()) {
        return null;
    }

    const beginning = decoder.getCursor();
    /* eslint-disable node/no-deprecated-api */
    const first = new Buffer(decoder.readBytes(1));
    /* eslint-enable node/no-deprecated-api */

    if (first.toString('hex') === '00') {
        return group.concat('');
    }

    if (first.toString('hex') === '01') {
        try {
            /* eslint-disable node/no-deprecated-api */
            return group.concat(new Buffer(decoder.readBytes(1)).toString());
            /* eslint-enable node/no-deprecated-api */
        } catch (err) {
            if (err.name !== 'AssertionError') {
                throw err;
            }

            return group;
        }
    }

    decoder.setCursor(beginning);

    while (!decoder.atEnd()) {
        group = group.concat(decoder.readStringWithLength());
    }

    return group;
}

/**
 * Decode a column value encoded using X Protocol SINT.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript number or string (to avoid loosing precision) containing the decimal value.
 */
function decodeSignedInt (reader, options) {
    // Even the "stringified" value is not lossless.
    // https://github.com/google/protobuf/blob/9021f623e1420f513268a01a5ad43a23618a84ba/js/binary/decoder.js#L745
    return formatSafeNumber(reader.getFieldDecoder().readZigzagVarint64String());
}

/**
 * Decode a column value encoded using X Protocol TIME.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {string} A JavaScript string containting the time representation.
 */
function decodeTime (reader, options) {
    options = Object.assign({ maxSize: MAX_TIME_SIZE }, options);

    return formatTime(decodeTemporalValue(reader, options));
}

/**
 * Decode a column value encoded using X Protocol TIME, DATE, DATETIME or TIMESTAMP.
 * @private
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing internal implementation details
 * @returns {number[]} A JavaScript array encoding the temporal representation.
 */
function decodeTemporalValue (reader, options) {
    options = Object.assign({ maxSize: 0 }, options);

    const decoder = reader.getFieldDecoder();
    /* eslint-disable node/no-deprecated-api */
    const startingPoint = new Buffer(options.maxSize);
    startingPoint.fill(0);
    /* eslint-enable node/no-deprecated-api */

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
 * @param {BinaryReader} reader
 * @param {options} [options] - object containing the column metadata
 * @returns {number|string} A JavaScript string (when there is overflow or zerofill) or number.
 */
function decodeUnsignedInt (reader, options) {
    const uint = formatSafeNumber(reader.getFieldDecoder().readUnsignedVarint64String());

    if (options.metadata.flags !== 1) {
        return uint;
    }

    return leftPad(uint, options.metadata.length, '0');
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

    if (options.metadata.flags > 0) {
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
    const fractionalDigits = value.toPrecision().slice(Math.floor(value).toString().length + 1).length;

    options = Object.assign({ metadata: { fractionalDigits, length: fractionalDigits + 1 } }, options);

    const metadata = options.metadata;

    return Math.round(value * Math.pow(10, metadata.fractionalDigits)) / Math.pow(10, metadata.fractionalDigits);
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

        /* eslint-disable node/no-deprecated-api */
        const padding = new Buffer(size - value.length);
        padding.fill(0);
        /* eslint-disable node/no-deprecated-api */

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

        /* eslint-disable node/no-deprecated-api */
        const padding = new Buffer(size - value.length);
        padding.fill(0);
        /* eslint-disable node/no-deprecated-api */

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
 * Decode a Mysqlx.Resultset.ColumnMetaData protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} An object containing column metadata properties.
 */
exports.decodeColumnMetaData = function (data) {
    /* eslint-disable node/no-deprecated-api */
    const proto = ColumnMetaData.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Resultset.ColumnMetaData', JSON.stringify(proto.toObject(), null, 2));

    const catalog = (new Buffer(proto.getCatalog())).toString();
    const name = (new Buffer(proto.getName())).toString();
    const schema = (new Buffer(proto.getSchema())).toString();
    const table = (new Buffer(proto.getTable())).toString();

    let originalName = (new Buffer(proto.getOriginalName())).toString();
    originalName = originalName.trim().length === 0 ? name : originalName;

    let originalTable = (new Buffer(proto.getOriginalTable())).toString();
    originalTable = originalTable.trim().length === 0 ? table : originalTable;
    /* eslint-enable node/no-deprecated-api */

    return Object.assign({}, proto.toObject(), { catalog, name, originalName, originalTable, schema, table });
};

/**
 * Decode a Mysqlx.Resultset.FetchDone protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDone = function (data) {
    const proto = FetchDone.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Resultset.FetchDone', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.FetchDoneMoreOutParams protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDoneMoreOutParams = function (data) {
    const proto = FetchDoneMoreOutParams.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Resultset.FetchDoneMoreOutParams', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.FetchDoneMoreResultsets protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDoneMoreResultsets = function (data) {
    const proto = FetchDoneMoreResultsets.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Resultset.FetchDoneMoreResultsets', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.Row protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @param {Object} [options] - object containing the column metadata
 * @returns {object[]} An array of plain JavaScript object representation of each column.
 */
exports.decodeRow = function (data, options) {
    options = Object.assign({ metadata: [] }, options);

    const proto = Row.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Resultset.Row', JSON.stringify(proto.toObject(), null, 2));

    return proto
        .getFieldList()
        .map((field, index) => decodeField(field, { metadata: options.metadata[index] }));
};
