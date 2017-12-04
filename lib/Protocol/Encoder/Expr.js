/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
 * Expr protobuf encoding adapter.
 * @private
 * @module Expr
 */

const Parser = require('../../ExprParser');

/**
 * Additional parser options.
 * @private
 * @typedef {Object} ParserOptions
 * @prop {number} [type] - the parser type (@see ExprParser)
 */

/**
 * Encode a Mysqlx.Expr.ColumnIdentifier type.
 * @function
 * @name module:Expr#encodeColumnIdentifier
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.ColumnIdentifier} The protobuf encoded object.
 */
exports.encodeColumnIdentifier = function (str, options) {
    options = Object.assign({ type: Parser.Type.COLUMN_OR_PATH }, options);

    return Parser.parse(str, options).getIdentifier();
};

/**
 * Encode a Mysqlx.Expr.Expr type.
 * @function
 * @name module:Expr#encodeExpr
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {proto.Mysqlx.Expr.Expr} The protobuf encoded object.
 */
exports.encodeExpr = function (str, options) {
    options = Object.assign({}, options);

    return Parser.parse(str, options).output;
};

/**
 * Encode the list of placeholders of a Mysqlx.Expr.Expr type.
 * @function
 * @name module:Expr#encodePlaceholders
 * @param {string} str - expression string
 * @param {ParserOptions} [options] - additional options
 * @returns {string[]} The list of placeholders.
 */
exports.encodePlaceholders = function (str, options) {
    options = Object.assign({}, options);

    return Parser.parse(str, options).placeholders;
};

/**
 * Checks if an value is a valid Mysqlx.Expr.Expr type.
 * @function
 * @name module:Expr#isValid
 * @param {*} any - any valid type
 * @returns {boolean}
 */
exports.isValid = function (any) {
    return typeof any.getType === 'function' && any.getType() >= 1 && any.getType() <= 8;
};
