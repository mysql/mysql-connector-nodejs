/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
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
 * Datatype protobuf encoding adapter.
 * @private
 * @module Datatypes
 */

const Datatypes = require('../Stubs/mysqlx_datatypes_pb');
const Resulset = require('../Stubs/mysqlx_resultset_pb');

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_BOOL.
 * @function
 * @private
 * @name module:Datatypes#encodeBoolean
 * @param {boolean} datatype - JavaScript boolean
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeBoolean (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_BOOL);
    scalar.setVBool(datatype);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar from a JavaScript float number.
 * @function
 * @private
 * @name module:Datatypes#encodeDecimal
 * @param {number} datatype - JavaScript float number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeDecimal (datatype) {
    const precision = datatype.toPrecision();
    const isDouble = precision.substring(precision.indexOf('.') + 1, precision.length) > 7;

    if (isDouble) {
        return encodeDouble(datatype);
    }

    return encodeFloat(datatype);
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_DOUBLE.
 * @function
 * @private
 * @name module:Datatypes#encodeDouble
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeDouble (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_DOUBLE);
    scalar.setVDouble(datatype);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_FLOAT.
 * @function
 * @private
 * @name module:Datatypes#encodeFloat
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeFloat (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_FLOAT);
    scalar.setVFloat(datatype);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar from a JavaScript integer number.
 * @function
 * @private
 * @name module:Datatypes#encodeInteger
 * @param {number} datatype - JavaScript integer number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeInteger (datatype) {
    if (datatype > 0) {
        return encodeUnsignedInteger(datatype);
    }

    return encodeSignedInteger(datatype);
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_NULL.
 * @function
 * @private
 * @name module:Datatypes#encodeNull
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeNull () {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_NULL);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#encodeNumber
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeNumber (datatype) {
    if (Number.isInteger(datatype)) {
        return encodeInteger(datatype);
    }

    return encodeDecimal(datatype);
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_OCTETS.
 * @function
 * @private
 * @name module:Datatypes#encodeOctets
 * @param {Buffer} datatypes - Node.js Buffer
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeOctets (datatype) {
    const bin = new Datatypes.Scalar.Octets();
    bin.setValue(new Uint8Array(datatype));
    // use some binary content-type (currently, only GEOMETRY is available)
    bin.setContentType(Resulset.ContentType_BYTES.GEOMETRY);

    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_OCTETS);
    scalar.setVOctets(bin);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_SINT.
 * @function
 * @private
 * @name module:Datatypes#encodeSignedInteger
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeSignedInteger (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_SINT);
    scalar.setVSignedInt(datatype);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_STRING.
 * @function
 * @private
 * @name module:Datatypes#encodeString
 * @param {string} datatype - JavaScript string
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeString (datatype) {
    const str = new Datatypes.Scalar.String();
    str.setValue(new Uint8Array(new Buffer(datatype)));

    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_STRING);
    scalar.setVString(str);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.V_UINT.
 * @function
 * @private
 * @name module:Datatypes#encodeUnsignedInteger
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
function encodeUnsignedInteger (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_UINT);
    scalar.setVUnsignedInt(datatype);

    return scalar;
};

/**
 * Encode a Mysqlx.Datatypes.Any.
 * @function
 * @name module:Datatypes#encodeAny
 * @param {*} datatype - any datatype type
 * @returns {proto.Mysqlx.Datatypes.Any} The protobuf encoded object.
 */
exports.encodeAny = function (datatype) {
    const any = new Datatypes.Any();

    if (Array.isArray(datatype)) {
        any.setType(Datatypes.Any.Type.ARRAY);
        any.setArray(this.encodeArray(datatype));

        return any;
    }

    if (Object(datatype) === datatype) {
        any.setType(Datatypes.Any.Type.OBJECT);
        any.setObj(this.encodeObject(datatype));

        return any;
    }

    any.setType(Datatypes.Any.Type.SCALAR);

    try {
        any.setScalar(this.encodeScalar(datatype));
    } catch (err) {
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Any.');
    }

    return any;
};

/**
 * Encode a Mysqlx.Datatypes.Array.
 * @function
 * @name module:Datatypes#encodeArray
 * @param {Array} datatypes - array of any type
 * @returns {proto.Mysqlx.Datatypes.Array} The protobuf encoded object.
 */
exports.encodeArray = function (datatypes) {
    const array = new Datatypes.Array();

    if (!Array.isArray(datatypes)) {
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Array.');
    }

    datatypes.forEach(item => array.addValue(this.encodeAny(item)));

    return array;
};

/**
 * Encode a Mysqlx.Datatypes.Object.
 * @function
 * @name module:Datatypes#encodeObject
 * @param {Object} datatypes - plain object
 * @returns {proto.Mysqlx.Datatypes.Object} The protobuf encoded object.
 */
exports.encodeObject = function (datatypes) {
    const obj = new Datatypes.Object();

    if (Object(datatypes) !== datatypes || typeof datatypes !== 'object' || Array.isArray(datatypes)) {
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Object.');
    }

    Object.keys(datatypes).forEach(key => {
        const field = new Datatypes.Object.ObjectField();

        field.setKey(key);
        field.setValue(this.encodeAny(datatypes[key]));

        obj.addFld(field);
    });

    return obj;
};

/**
 * Encode a Mysqlx.Datatypes.Scalar.
 * @function
 * @name module:Datatypes#encodeScalar
 * @param {*} datatype - any valid datatype JavaScript type
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
exports.encodeScalar = function (datatype) {
    if (typeof datatype === 'boolean') {
        return encodeBoolean(datatype);
    }

    if (typeof datatype === 'number') {
        return encodeNumber(datatype);
    }

    if (typeof datatype === 'string') {
        return encodeString(datatype);
    }

    if (datatype instanceof Buffer) {
        return encodeOctets(datatype);
    }

    if (datatype === null) {
        return encodeNull();
    }

    throw new Error('Invalid datatype for Mysqlx.Datatypes.Scalar.');
};
