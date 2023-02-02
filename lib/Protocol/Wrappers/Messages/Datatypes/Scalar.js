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

const ScalarStub = require('../../../Stubs/mysqlx_datatypes_pb').Scalar;
const bytes = require('../../ScalarValues/bytes');
const octets = require('./Octets');
const str = require('./String');
const wraps = require('../../Traits/Wraps');

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_BOOL protobuf message from a JavaScript boolean.
 * @function
 * @private
 * @param {boolean} value - JavaScript boolean
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeBoolean (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_BOOL);
    proto.setVBool(value);

    return proto;
}

/**
 * Encode a Mysqlx.Datatypes.Scalar protobuf message from a JavaScript number.
 * @function
 * @private
 * @param {number} value - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeNumber (value) {
    switch (Number.isSafeInteger(value)) {
    case true:
        return encodeInteger(value);
    case false:
        // If it is not a safe integer, it is either a floating point number
        // or an unsafe integer.
        switch (Number.isInteger(value)) {
        case true:
            // For certain cases, for instance, it is possible that the number
            // can be an unsafe integer. For instance, JavaScript is still
            // able to happily store Number.MAX_SAFE_INTEGER + 1 or
            // Number.MIN_SAFE_INTEGER - 1.
            return encodeString(`${value}`);
        case false:
            return encodeDouble(value);
        }
    }
}

/**
 * Encode a Mysqlx.Datatypes.Scalar protobuf message from a JavaScript integer number.
 * @function
 * @private
 * @param {number} value - JavaScript integer number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeInteger (value) {
    switch (value >= 0) {
    case true:
        return encodeUnsignedInteger(value);
    case false:
        return encodeSignedInteger(value);
    }
}

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_SINT protobuf message from a JavaScript integer number.
 * @function
 * @private
 * @param {number} value - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeSignedInteger (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_SINT);
    proto.setVSignedInt(value.toString());

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_UINT protobuf message from a JavaScript integer number.
 * @function
 * @private
 * @param {number} value - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeUnsignedInteger (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_UINT);
    proto.setVUnsignedInt(value.toString());

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_DOUBLE protobuf message from a JavaScript number.
 * @function
 * @private
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeDouble (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_DOUBLE);
    proto.setVDouble(value);

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_STRING protobuf message from a JavaScript Date instance.
 * @function
 * @private
 * @param {string} value - JavaScript Date instance
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeDate (value) {
    // The MySQL optimiser does not allow the Zulu Time indicator because
    // it is not covered by the SQL standard.
    // We need to replace it by the corresponding explicit time zone
    // displacement indicator (+00:00).
    // Although we do not have to worry about downstream convertion (from
    // JSON to a Date instance), the Date constructor still works fine
    // using the explicit displacement indicator.
    const date = value.toJSON();
    const displacement = '+00:00';

    return encodeString(date.substring(0, date.length - 1).concat(displacement));
}

/**
 * Create a Mysqlx.Datatypes.Scalar.String protobuf message from a JavaScript String.
 * @function
 * @private
 * @param {string} value - JavaScript string
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeString (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_STRING);
    proto.setVString(encodeStringValue(value));

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_STRING protobuf message from a JavaScript String.
 * @function
 * @private
 * @param {string} value - JavaScript string
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeStringValue (value) {
    const proto = new ScalarStub.String();
    proto.setValue(bytes.create(Buffer.from(value)).valueOf());

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_OCTETS protobuf message from a Node.js Buffer.
 * @function
 * @private
 * @param {Buffer} value - Node.js Buffer
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeOctets (value) {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_OCTETS);
    proto.setVOctets(encodeOctetsValue(value));

    return proto;
}

/**
 * Create a Mysqlx.Datatypes.Scalar.Octets protobuf message from a Node.js Buffer.
 * @function
 * @private
 * @param {Buffer} value - Node.js Buffer
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeOctetsValue (value) {
    const proto = new ScalarStub.Octets();
    proto.setValue(bytes.create(Buffer.from(value)).valueOf());

    return proto;
}

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_NULL protobuf message.
 * @function
 * @private
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function encodeNull () {
    const proto = new ScalarStub();
    proto.setType(ScalarStub.Type.V_NULL);

    return proto;
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
            // With the "[jstype = JS_STRING]" hint enabled, both the
            // "v_signed_int" and "v_unsigned_int" fields contain a string.
            // This ensures that unsafe values (which cannot be represented as
            // JavaScript numbers) do not lose precision.
            // In the client side, those values can always be converted to
            // BigInt.
            case ScalarStub.Type.V_SINT:
                return { type: this.getType(), v_signed_int: BigInt(proto.getVSignedInt()) };
            case ScalarStub.Type.V_UINT:
                return { type: this.getType(), v_unsigned_int: BigInt(proto.getVUnsignedInt()) };
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
            // With the "[jstype = JS_STRING]" hint enabled, both the
            // "v_signed_int" and "v_unsigned_int" fields contain a string.
            // This ensures that unsafe values (which cannot be represented as
            // JavaScript numbers) do not lose precision.
            // In the client side, those values can always be converted to
            // BigInt.
            case ScalarStub.Type.V_SINT:
                return BigInt(proto.getVSignedInt());
            case ScalarStub.Type.V_UINT:
                return BigInt(proto.getVUnsignedInt());
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
 * Create a wrapper for a Mysqlx.Datatypes.Scalar protobuf message
 * for a given JavaScript literal value.
 * @private
 * @param {*} - The extracted value.
 * @param {boolean} [opaque] - If the value should be encoded as octets.
 * @returns {module:adapters.Mysqlx.Datatypes.Scalar}
 */
Scalar.create = ({ value, opaque = false } = {}) => {
    switch (typeof value) {
    case 'bigint':
        return Scalar(encodeInteger(value));
    case 'boolean':
        return Scalar(encodeBoolean(value));
    case 'number':
        return Scalar(encodeNumber(value));
    case 'object':
        // The value can be a Date or a Buffer instance.
        // If it is a Date instance, it should be encoded as a string, but
        // there are some specific rules.
        if (value instanceof Date) {
            return Scalar(encodeDate(value));
        }

        // If it is a Buffer intance, it should be encoded as octets.
        if (value instanceof Buffer) {
            return Scalar(encodeOctets(value));
        }

        // If it is null, it should be encoded as so.
        if (Object(value) !== value) {
            return Scalar(encodeNull());
        }

        // Otherwise, it means it is some other object, and it cannot be
        // encoded as a scalar value. The X Plugin will eventually yield
        // an appropriate error if that is the case.
        return Scalar();
    case 'string':
        // Non-opaque strings should be encoded as regular strings.
        if (!opaque) {
            return Scalar(encodeString(value));
        }

        // Opaque strings should be encoded as octets.
        return Scalar(encodeOctets(value));
    default:
        // If the value is undefined or the type unknown, there is nothing to do.
        return Scalar();
    }
};

module.exports = Scalar;
