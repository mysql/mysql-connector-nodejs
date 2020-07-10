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

const ScalarStub = require('../../../Stubs/mysqlx_datatypes_pb').Scalar;
const bytes = require('../../ScalarValues/bytes');
const octets = require('./Octets');
const str = require('./String');
const wraps = require('../../Traits/Wraps');

/**
 * Create a Mysqlx.Datatypes.Scalar.V_BOOL.
 * @function
 * @private
 * @param {boolean} datatype - JavaScript boolean
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createBoolean (datatype) {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_BOOL);
    scalar.setVBool(datatype);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript float number.
 * @function
 * @private
 * @param {number} datatype - JavaScript float number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createDecimal (datatype) {
    const precision = datatype.toPrecision();
    // A FLOAT in essence is 32-bit floating point value, which means it
    // reserves 23 bits (less than 3 bytes) for precision. So, it loses
    // precision when the number of decimal digits is greater than 4, since
    // numbers above 65536 need 2^17 (more than 2 bytes / 16 bits)
    const maxFloatDigits = 4;
    const isDouble = precision.substring(precision.indexOf('.') + 1, precision.length).length > maxFloatDigits;

    if (isDouble) {
        return createDouble(datatype);
    }

    return createFloat(datatype);
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_DOUBLE from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createDouble (datatype) {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_DOUBLE);
    scalar.setVDouble(datatype);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_FLOAT from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createFloat (datatype) {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_FLOAT);
    scalar.setVFloat(datatype);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript integer number.
 * @function
 * @private
 * @param {number} datatype - JavaScript integer number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createInteger (datatype) {
    if (datatype > 0) {
        return createUnsignedInteger(datatype);
    }

    return createSignedInteger(datatype);
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_NULL.
 * @function
 * @private
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createNull () {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_NULL);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createNumber (datatype) {
    if (Number.isInteger(datatype)) {
        return createInteger(datatype);
    }

    return createDecimal(datatype);
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_OCTETS from a Node.js Buffer.
 * @function
 * @private
 * @param {Buffer} datatypes - Node.js Buffer
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createOctets (datatype) {
    const bin = new ScalarStub.Octets();
    bin.setValue(bytes.deserialize(datatype).valueOf());

    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_OCTETS);
    scalar.setVOctets(bin);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_SINT from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createSignedInteger (datatype) {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_SINT);
    scalar.setVSignedInt(datatype);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_STRING from a JavaScript String.
 * @function
 * @private
 * @param {string} datatype - JavaScript string
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createString (datatype) {
    const str = new ScalarStub.String();
    // eslint-disable-next-line node/no-deprecated-api
    str.setValue(bytes.deserialize(new Buffer(datatype)).valueOf());

    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_STRING);
    scalar.setVString(str);

    return scalar;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_UINT from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createUnsignedInteger (datatype) {
    const scalar = new ScalarStub();
    scalar.setType(ScalarStub.Type.V_UINT);
    scalar.setVUnsignedInt(datatype);

    return scalar;
}

/**
 * Check if a value is undefined.
 * @function
 * @private
 * @returns {boolean}
 */
function isUndefined (value) {
    return typeof value === 'undefined';
}

/**
 * Check if a value is an instance of the Mysqlx.Datatypes.Scalar stub.
 * @function
 * @private
 * @returns {boolean}
 */
function isProto (value) {
    return value instanceof ScalarStub;
}

/**
 * Check if a value is a JavaScript number.
 * @function
 * @private
 * @returns {boolean}
 */
function isNumber (value) {
    return typeof value === 'number';
}

/**
 * Check if a value is null.
 * @function
 * @private
 * @returns {boolean}
 */
function isNull (value) {
    return value === null;
}

/**
 * Check if a value is an instance of a Node.js Buffer.
 * @function
 * @private
 * @returns {boolean}
 */
function isBuffer (value) {
    return Buffer.isBuffer(value);
}

/**
 * Check if a value is a boolean.
 * @function
 * @private
 * @returns {boolean}
 */
function isBoolean (value) {
    return typeof value === 'boolean';
}

/**
 * Check if a value is an instance of a JavaScript Date.
 * @function
 * @private
 * @returns {boolean}
 */
function isDate (value) {
    return value instanceof Date;
}

/**
 * Check if a value is a JavaScript string.
 * @function
 * @private
 * @returns {boolean}
 */
function isString (value) {
    return typeof value === 'string';
}

/**
 * @private
 * @alias module:Scalar
 * @param {Mysqlx.Datatypes.Scalar} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.Scalar}
 */
function Scalar (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the name of the X Protocol type of the scalar.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Scalar#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(ScalarStub.Type).filter(k => ScalarStub.Type[k] === proto.getType())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Scalar#toJSON
         * @returns {Object}
         */
        toJSON () {
            switch (proto.getType()) {
            case ScalarStub.Type.V_SINT:
                return { type: this.getType(), v_signed_int: proto.getVSignedInt() };
            case ScalarStub.Type.V_UINT:
                return { type: this.getType(), v_unsigned_int: proto.getVUnsignedInt() };
            case ScalarStub.Type.V_NULL:
                return { type: this.getType() };
            case ScalarStub.Type.V_OCTETS:
                return { type: this.getType(), v_octets: octets(proto.getVOctets()).toJSON() };
            case ScalarStub.Type.V_DOUBLE:
                return { type: this.getType(), v_double: proto.getVDouble() };
            case ScalarStub.Type.V_FLOAT:
                return { type: this.getType(), v_float: proto.getVFloat() };
            case ScalarStub.Type.V_BOOL:
                return { type: this.getType(), v_bool: proto.getVBool() };
            case ScalarStub.Type.V_STRING:
                return { type: this.getType(), v_string: str(proto.getVString()).toJSON() };
            }
        },

        /**
         * Retrieve the underlying value encoded in the appropriate JavaScript type.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Scalar#toLiteral
         */
        toLiteral () {
            switch (proto.getType()) {
            case ScalarStub.Type.V_SINT:
                return proto.getVSignedInt();
            case ScalarStub.Type.V_UINT:
                return proto.getVUnsignedInt();
            case ScalarStub.Type.V_NULL:
                return null;
            case ScalarStub.Type.V_OCTETS:
                return octets(proto.getVOctets()).toBuffer();
            case ScalarStub.Type.V_DOUBLE:
                return proto.getVDouble();
            case ScalarStub.Type.V_FLOAT:
                return proto.getVFloat();
            case ScalarStub.Type.V_BOOL:
                return proto.getVBool();
            case ScalarStub.Type.V_STRING:
                return str(proto.getVString()).toString();
            }
        }
    });
}

/**
 * Checks if a value can be encoded as a Mysqlx.Datatypes.Scalar.
 * @returns {boolean}
 */
Scalar.canEncode = function (value) {
    return isUndefined(value) || isProto(value) || isNumber(value) || isNull(value) || isBuffer(value) || isBoolean(value) || isDate(value) || isString(value);
};

/**
 * Creates and wraps a Mysqlx.Datatypes.Scalar instance for a given value.
 * @returns {module:adapters.Mysqlx.Datatypes.Scalar}
 */
Scalar.create = function (value) {
    if (isUndefined(value)) {
        return Scalar();
    }

    if (isProto(value)) {
        return Scalar(value);
    }

    if (isNumber(value)) {
        return Scalar(createNumber(value));
    }

    if (isNull(value)) {
        return Scalar(createNull());
    }

    if (isBuffer(value)) {
        return Scalar(createOctets(value));
    }

    if (isBoolean(value)) {
        return Scalar(createBoolean(value));
    }

    if (isDate(value)) {
        return Scalar(createString(value.toJSON()));
    }

    if (isString(value)) {
        return Scalar(createString(value));
    }
};

module.exports = Scalar;
