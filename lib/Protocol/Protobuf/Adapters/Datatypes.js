/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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
 * Datatype encoding adapter.
 * @private
 * @module Datatypes
 */

const Datatypes = require('../Stubs/mysqlx_datatypes_pb');
const Resultset = require('../Stubs/mysqlx_resultset_pb');

/**
 * Extract data encoded as protobuf bytes.
 * @function
 * @name module:Datatypes#extractOctets_
 * @param {Mysqlx.Datatypes.Any} proto - protobuf instance
 * @returns {Buffer|string} A Node.js Buffer for binary data or a JavaScript string for textual data.
 * @throws Will throw an error if the type is not valid.
 */
function extractOctets_ (proto) {
    const octets = proto.getVOctets();
    /* eslint-disable node/no-deprecated-api */
    const data = new Buffer(octets.getValue());
    /* eslint-enable node/no-deprecated-api */

    if (octets.getContentType() === Resultset.ContentType_BYTES.GEOMETRY) {
        return data;
    }

    return data.toString();
}

/**
 * Create a Mysqlx.Datatypes.Scalar.V_BOOL.
 * @function
 * @private
 * @name module:Datatypes#createBoolean
 * @param {boolean} datatype - JavaScript boolean
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createBoolean (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_BOOL);
    scalar.setVBool(datatype);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript float number.
 * @function
 * @private
 * @name module:Datatypes#createDecimal
 * @param {number} datatype - JavaScript float number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createDecimal (datatype) {
    const precision = datatype.toPrecision();
    const isDouble = precision.substring(precision.indexOf('.') + 1, precision.length) > 7;

    if (isDouble) {
        return createDouble(datatype);
    }

    return createFloat(datatype);
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_DOUBLE from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#createDouble
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createDouble (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_DOUBLE);
    scalar.setVDouble(datatype);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_FLOAT from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#createFloat
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createFloat (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_FLOAT);
    scalar.setVFloat(datatype);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript integer number.
 * @function
 * @private
 * @name module:Datatypes#createInteger
 * @param {number} datatype - JavaScript integer number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createInteger (datatype) {
    if (datatype > 0) {
        return createUnsignedInteger(datatype);
    }

    return createSignedInteger(datatype);
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_NULL.
 * @function
 * @private
 * @name module:Datatypes#createNull
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createNull () {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_NULL);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#createNumber
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createNumber (datatype) {
    if (Number.isInteger(datatype)) {
        return createInteger(datatype);
    }

    return createDecimal(datatype);
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_OCTETS from a Node.js Buffer.
 * @function
 * @private
 * @name module:Datatypes#createOctets
 * @param {Buffer} datatypes - Node.js Buffer
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createOctets (datatype) {
    const bin = new Datatypes.Scalar.Octets();
    bin.setValue(new Uint8Array(datatype));

    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_OCTETS);
    scalar.setVOctets(bin);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_SINT from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#createSignedInteger
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createSignedInteger (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_SINT);
    scalar.setVSignedInt(datatype);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_STRING from a JavaScript String.
 * @function
 * @private
 * @name module:Datatypes#createString
 * @param {string} datatype - JavaScript string
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createString (datatype) {
    const str = new Datatypes.Scalar.String();
    /* eslint-disable node/no-deprecated-api */
    str.setValue(new Uint8Array(new Buffer(datatype)));
    /* eslint-enable node/no-deprecated-api */

    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_STRING);
    scalar.setVString(str);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Scalar.V_UINT from a JavaScript number.
 * @function
 * @private
 * @name module:Datatypes#createUnsignedInteger
 * @param {number} datatype - JavaScript number
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
function createUnsignedInteger (datatype) {
    const scalar = new Datatypes.Scalar();
    scalar.setType(Datatypes.Scalar.Type.V_UINT);
    scalar.setVUnsignedInt(datatype);

    return scalar;
};

/**
 * Create a Mysqlx.Datatypes.Any from a JavaScript type.
 * @function
 * @name module:Datatypes#createAny
 * @param {*} datatype - any datatype type
 * @returns {proto.Mysqlx.Datatypes.Any} The protobuf object version.
 */
exports.createAny = function (datatype) {
    const any = new Datatypes.Any();

    if (this.isScalar(datatype)) {
        any.setType(Datatypes.Any.Type.SCALAR);
        any.setScalar(datatype);

        return any;
    }

    if (Array.isArray(datatype)) {
        any.setType(Datatypes.Any.Type.ARRAY);
        any.setArray(this.createArray(datatype));

        return any;
    }

    if (datatype && typeof datatype === 'object' && !(datatype instanceof Date) && !(datatype instanceof Buffer)) {
        any.setType(Datatypes.Any.Type.OBJECT);
        any.setObj(this.createObject(datatype));

        return any;
    }

    any.setType(Datatypes.Any.Type.SCALAR);
    any.setScalar(this.createScalar(datatype));

    return any;
};

/**
 * Create a Mysqlx.Datatypes.Array from a JavaScript Array.
 * @function
 * @name module:Datatypes#createArray
 * @param {Array} datatypes - array of any type
 * @returns {proto.Mysqlx.Datatypes.Array} The protobuf object version.
 */
exports.createArray = function (datatypes) {
    const array = new Datatypes.Array();

    if (!Array.isArray(datatypes)) {
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Array.');
    }

    datatypes.forEach(item => array.addValue(this.createAny(item)));

    return array;
};

/**
 * Create a Mysqlx.Datatypes.Object from a JavaScript Object.
 * @function
 * @name module:Datatypes#createObject
 * @param {Object} datatypes - plain object
 * @returns {proto.Mysqlx.Datatypes.Object} The protobuf object version.
 */
exports.createObject = function (datatypes) {
    const obj = new Datatypes.Object();

    if (Object(datatypes) !== datatypes || typeof datatypes !== 'object' || Array.isArray(datatypes)) {
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Object.');
    }

    Object.keys(datatypes).forEach(key => {
        const field = new Datatypes.Object.ObjectField();

        field.setKey(key);
        field.setValue(this.createAny(datatypes[key]));

        obj.addFld(field);
    });

    return obj;
};

/**
 * Create a Mysqlx.Datatypes.Scalar from a JavaScript type.
 * @function
 * @name module:Datatypes#createScalar
 * @param {*} datatype - any valid datatype JavaScript type
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf object version.
 */
exports.createScalar = function (datatype) {
    if (typeof datatype === 'boolean') {
        return createBoolean(datatype);
    }

    if (typeof datatype === 'number') {
        return createNumber(datatype);
    }

    if (typeof datatype === 'string') {
        return createString(datatype);
    }

    if (datatype instanceof Buffer) {
        return createOctets(datatype);
    }

    if (datatype instanceof Date) {
        return createString(datatype.toJSON());
    }

    if (typeof datatype === 'undefined' || datatype === null) {
        return createNull();
    }

    throw new Error('Invalid datatype for Mysqlx.Datatypes.Scalar.');
};

/**
 * Extract a sane JavaScript type from a Mysqlx.Datatypes.Any protobuf type.
 * @function
 * @name module:Datatypes#extractAny
 * @param {Mysqlx.Datatypes.Any} proto - protobuf instance
 * @returns {*} A native JavaScript type representation
 * @throws Will throw an error if the type is not valid.
 */
exports.extractAny = function (proto) {
    const type = proto.getType();

    if (type === Datatypes.Any.Type.SCALAR) {
        return this.extractScalar(proto.getScalar());
    }

    if (type === Datatypes.Any.Type.OBJECT) {
        return this.extractObject(proto.getObj());
    }

    if (type === Datatypes.Any.Type.ARRAY) {
        return this.extractArray(proto.getArray());
    }

    throw new Error('Invalid datatype for Mysqlx.Datatypes.Any.');
};

/**
 * Extract a JavaScript Array from a Mysqlx.Datatypes.Array protobuf type.
 * @function
 * @name module:Datatypes#extractArray
 * @param {Mysqlx.Datatypes.Array} proto - protobuf instance
 * @returns {Array.<*>} A JavaScript array
 */
exports.extractArray = function (proto) {
    return proto
        .getValueList()
        .map(value => this.extractAny(value));
};

/**
 * Extract a JavaScript Object Mysqlx.Datatypes.Object protobuf message.
 * @function
 * @name module:Datatypes#extractObject
 * @param {Mysqlx.Datatypes.Object} proto - protobuf instance
 * @returns {Object} A plain JavaScript object
 */
exports.extractObject = function (proto) {
    return proto
        .getFldList()
        .reduce((obj, field) => Object.assign(obj, { [field.getKey()]: this.extractAny(field.getValue()) }), {});
};

/**
 * Extract a sane JavaScript scalar type from Mysqlx.Datatypes.Scalar protobuf type.
 * @function
 * @name module:Datatypes#extractScalar
 * @param {Mysqlx.Datatypes.Scalar} proto - protobuf instance
 * @returns {*} A JavaScript primitive type
 * @throws Will throw an error if the instance is not a valid protobuf instance.
 */
exports.extractScalar = function (proto) {
    switch (proto.getType()) {
    case Datatypes.Scalar.Type.V_SINT:
        return proto.getVSignedInt();
    case Datatypes.Scalar.Type.V_UINT:
        return proto.getVUnsignedInt();
    case Datatypes.Scalar.Type.V_NULL:
        return null;
    case Datatypes.Scalar.Type.V_OCTETS:
        return extractOctets_(proto);
    case Datatypes.Scalar.Type.V_DOUBLE:
        return proto.getVDouble();
    case Datatypes.Scalar.Type.V_FLOAT:
        return proto.getVFloat();
    case Datatypes.Scalar.Type.V_BOOL:
        return proto.getVBool();
    case Datatypes.Scalar.Type.V_STRING:
        // TODO(Rui): watch out for the encoding.
        /* eslint-disable node/no-deprecated-api */
        return (new Buffer(proto.getVString().getValue())).toString();
        /* eslint-enable node/no-deprecated-api */
    default:
        throw new Error('Invalid datatype for Mysqlx.Datatypes.Scalar.');
    }
};

/**
 * Check if a given value is an instance of Mysqlx.Datatypes.Scalar.
 * @function
 * @name module:Datatypes#isScalar
 * @param {*} datatype - any valid datatype JavaScript type
 * @returns {Boolean}
 */
exports.isScalar = function (datatype) {
    const types = Datatypes.Scalar.Type;

    return datatype && typeof datatype.getType === 'function' &&
        Object.keys(types).some(type => types[type] === datatype.getType());
};
