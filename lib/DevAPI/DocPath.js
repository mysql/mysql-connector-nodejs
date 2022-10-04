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
 * Factory function to create instances of an informal type that represents
 * the full path to reach a document field.
 * @private
 * @module DocPath
 */

const parser = ExprParser({ type: ExprParser.Type.DOCUMENT_FIELD });

/**
 * A document field name definition as represented by a string or an X DevAPI
 * expression instance.
 * @typedef {string|module:Expr} DocPath
 * @global
 * @example
 * // string
 * 'foo.bar.baz'
 * '$.foo.bar'
 * 'foo[0].bar'
 * // X DevAPI expression
 * mysqlx.expr('foo.bar.baz')
 * mysqlx.expr('$.foo.bar')
 * mysqlx.expr('foo[0].baz')
 */

/**
 * One or more field document path.
 * @typedef {DocPath|DocPath[]} DocPaths
 * @global
 */

/**
 * @private
 * @alias module:DocPath
 * @param {DocPath} value - The full path of a document field.
 * @returns {module:DocPath}
 */
function DocPath (value) {
    return {
        /**
         * Parses the underlying expression and return the result.
         * @private
         * @function
         * @name module:DocumentOrJSON#getValue
         * @returns {ExpressionTree} A Plain JavaScript object which represents
         * a tree that results from parsing a given X DevAPI expression
         * instance.
         */
        getValue () {
            return parser.parse(Expr({ value }).getExpressionString()).value;
        }
    };
}

module.exports = DocPath;
