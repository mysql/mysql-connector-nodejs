/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

const Expr = require('./Expr');
const ExprParser = require('../ExprParser');

/**
 * A column name definition as represented by a string or an X DevAPI
 * expression instance.
 * @typedef {string} TableField
 * @global
 * @example
 * 'foo.bar.baz->>"$qux.quux"'
 */

/**
 * One or more document definitions.
 * @typedef {TableField|TableField[]} TableFields
 * @global
 */

const parser = ExprParser({ type: ExprParser.Type.COLUMN_IDENT });

/**
 * @private
 * @alias module:TableField
 * @param {TableField} value - The full path of a column identifier.
 * @returns {module:TableField}
 */
function TableField (value) {
    return {
        /**
         * Parses the underlying expression and return the result.
         * @private
         * @function
         * @name module:DocumentOrJSON#getValue
         * @returns {ExpressionTree} A plain JavaScript object which
         * represents a tree that results from parsing a given X DevAPI
         * expression instance.
         */
        getValue () {
            return parser.parse(Expr({ value }).getExpressionString()).value;
        }
    };
}

module.exports = TableField;
