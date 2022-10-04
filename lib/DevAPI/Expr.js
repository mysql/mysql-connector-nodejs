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

const ExprParser = require('../ExprParser');

/**
 * Factory function to create instances of an informal type that represents
 * a local document instance.
 * @module Expr
 */

const parsers = {
    [ExprParser.Mode.DOCUMENT]: ExprParser(),
    [ExprParser.Mode.TABLE]: ExprParser({ mode: ExprParser.Mode.TABLE })
};

/**
 * Expression that establishes the filtering criteria.
 * @typedef {string|module:Expr} SearchConditionStr
 * @global
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr|SearchConditionStr}
 * @examples
 * // strings
 * foo = 'bar'
 * foo > 42
 * foo = bar
 * foo = :bar
 * foo in (:bar, :baz)
 * foo in [:bar, :baz]
 * foo in json_extract({ "keys": [:bar, :baz] }, "$.keys[*]")
 * // X DevAPI expressions
 * mysqlx.expr('foo = cast(bar as varchar(3))')
 */

/**
 * Expression that establishes the elements to include in an aggregation.
 * @typedef {string|module:Expr} SearchExprStr
 * @global
 * @examples
 * // strings
 * avg(foo)
 * sum(bar)
 * // X DevAPI expressions
 * mysqlx.expr('avg(foo)')
 * mysqlx.expr('avg(bar)')
 */

/**
 * One or more expressions that establishes an aggregation.
 * @typedef {SearchExprStr|SearchExprStr[]} SearchExprStrList
 * @global
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchexprstrlist|SearchExprStrList}
 * @examples
 * avg(foo), sum(bar)
 * [avg(foo), sum(bar)]
 */

/**
 * Object containing the result of parsing an X DevAPI expression.
 * @private
 * @typedef {Object} ExpressionTree
 * @prop {string} [type] - The expression type.
 * @prop {*} value - The JavaScript value that better matches the expression.
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html|X DevAPI Expressions}
 */

/**
 * @private
 * @alias module:Expr
 * @param {DataModel} [dataModel] - The data model to use for parsing the
 * value when determining between document fields and column identifiers.
 * @param {string|moduleExpr} [value] - An X DevAPI expression string or
 * instance.
 * @returns {module:Expr}
 */
function Expr ({ dataModel = ExprParser.Mode.DOCUMENT, value = '' } = {}) {
    return {
        /**
         * Retrieves the original string encapsulated by this X DevAPI
         * expression instance.
         * @function
         * @name module:Expr#getExpressionString
         * @returns {string} The original expression string.
         */
        getExpressionString () {
            // If value is not Expr, we should return it back as string.
            if (this.isLiteral()) {
                return value.toString();
            }

            // If value is already an instance of Expr, we should retrive
            // the expression string.
            return value.getExpressionString();
        },

        /**
         * Parses the original string encapsulated by this X DevAPI
         * expression instance.
         * @private
         * @function
         * @name module:Expr#getValue
         * @returns {ExpressionTree} An object containing a JavaScript
         * representation of the X DevAPI expression.
         */
        getValue () {
            return parsers[dataModel].parse(this.getExpressionString());
        },

        /**
         * Checks if the underlying expression is a string or an X DevAPI
         * expression instance.
         * @private
         * @function
         * @name module:Expr#isLiteral
         * @returns {boolean}
         */
        isLiteral () {
            return !value || typeof value.getExpressionString !== 'function';
        }
    };
}

module.exports = Expr;
