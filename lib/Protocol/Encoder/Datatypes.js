/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

'use strict';

/**
 * Datatype protobuf encoding adapter.
 * @private
 * @module Datatypes
 */

const Datatypes = require('../Stubs/mysqlx_datatypes_pb');
const Parser = require('../../ExprParser');

/**
 * Additional parser options.
 * @private
 * @typedef {Object} ParserOptions
 * @prop {number} [type] - the parser type (@see ExprParser)
 */

/**
 * Encode a Mysqlx.Datatypes.Scalar.
 * @function
 * @name module:Datatypes#encodeScalar
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Datatypes.Scalar} The protobuf encoded object.
 */
exports.encodeScalar = function (str, options) {
    options = Object.assign({ type: Parser.Type.LITERAL }, options);

    return Parser.parse(str, options).output;
};

/**
 * Encode a Mysqlx.Datatypes.Any.
 * @function
 * @name module:Datatypes#encodeAny
 * @param {*} datatype - any datatype type
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Datatypes.Any} The protobuf encoded object.
 */
exports.encodeAny = function (datatype, options) {
    options = Object.assign({}, options);

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

    const validTypes = ['boolean', 'number', 'string'];

    if (datatype === null || validTypes.indexOf(typeof datatype) > -1) {
        any.setType(Datatypes.Any.Type.SCALAR);
        any.setScalar(this.encodeScalar(JSON.stringify(datatype)));

        return any;
    }

    throw new Error('Invalid datatype for Mysqlx.Datatypes.Any.');
};

/**
 * Encode a Mysqlx.Datatypes.Array.
 * @function
 * @name module:Datatypes#encodeArray
 * @param {Array} datatypes - array of any type
 * @param {ParserOptions} [options] - additional options
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
 * @param {ParserOptions} [options] - additional options
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
