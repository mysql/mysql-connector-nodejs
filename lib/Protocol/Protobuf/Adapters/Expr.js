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
 * Expr protobuf adapter.
 * @private
 * @module Expr
 */

const Datatypes = require('./Datatypes');
const Expr = require('../Stubs/mysqlx_expr_pb');
const Parser = require('../../../ExprParser');

/**
 * Additional parser options.
 * @private
 * @typedef {Object} ParserOptions
 * @prop {boolean} [parse] - enable the parser
 * @prop {number} [type] - the parser type (@see ExprParser)
 */

/**
 * Create a Mysqlx.Expr.Array type from a JavaScript Array.
 * @function
 * @name module:Expr#createArray
 * @param {Array} value - an array
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.Array} The protobuf object version.
 */
exports.createArray = function (value, options) {
    options = Object.assign({ parse: false }, options);

    const array = new Expr.Array();

    value.forEach(item => array.addValue(this.createExpr(item, options)));

    return array;
};

/**
 * Create a Mysqlx.Expr.ColumnIdentifier type.
 * @function
 * @name module:Expr#createColumnIdentifier
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.ColumnIdentifier} The protobuf object version.
 */
exports.createColumnIdentifier = function (str, options) {
    options = Object.assign({ type: Parser.Type.COLUMN_OR_PATH }, options);

    return Parser.parse(str, options).getIdentifier();
};

/**
 * Create a Mysqlx.Expr.Expr type from a JavaScript native type.
 * @function
 * @name module:Expr#createExpr
 * @param {*} value - a JavaScript type
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.Expr} The protobuf object version.
 */
exports.createExpr = function (value, options) {
    options = Object.assign({ parse: true }, options);

    if (this.isValid(value)) {
        return value;
    }

    if (options.parse) {
        value = typeof value === 'string' ? value : JSON.stringify(value);

        return Parser.parse(value, options).output;
    }

    const result = new Expr.Expr();

    if (!value || value instanceof Buffer || value instanceof Date || typeof value !== 'object') {
        result.setType(Expr.Expr.Type.LITERAL);
        result.setLiteral(Datatypes.createScalar(value));

        return result;
    }

    if (Array.isArray(value)) {
        result.setType(Expr.Expr.Type.ARRAY);
        result.setArray(this.createArray(value));

        return result;
    }

    result.setType(Expr.Expr.Type.OBJECT);
    result.setObject(this.createObject(value));

    return result;
};

/**
 * Create a Mysqlx.Expr.Object from a JavaScript plain Object.
 * @function
 * @name module:Expr#createObject
 * @param {Object} value - an object
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.Object} The protobuf object version.
 */
exports.createObject = function (value, options) {
    options = Object.assign({ parse: false }, options);

    const obj = new Expr.Object();

    Object.keys(value).forEach(key => {
        const field = new Expr.Object.ObjectField();
        field.setKey(key);
        field.setValue(this.createExpr(value[key], options));

        obj.addFld(field);
    });

    return obj;
};

/**
 * Create an expression placeholder.
 * @function
 * @name module:Expr#createPlaceholder
 * @param {Number} position - the placeholder value index
 * @returns {proto.Mysqlx.Expr.Expr} The protobuf object version.
 */
exports.createPlaceholder = function (position) {
    const expr = new Expr.Expr();
    expr.setType(Expr.Expr.Type.PLACEHOLDER);
    expr.setPosition(position);

    return expr;
};

/**
 * Checks if an value is a valid Mysqlx.Expr.Expr type.
 * @function
 * @name module:Expr#isValid
 * @param {*} any - any valid type
 * @returns {boolean}
 */
exports.isValid = function (any) {
    return any && typeof any.getType === 'function' && any.getType() >= 1 && any.getType() <= 8;
};

/**
 * Export Stub Types enum.
 */
exports.Type = Expr.Expr.Type;
