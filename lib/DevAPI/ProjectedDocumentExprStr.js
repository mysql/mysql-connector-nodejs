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
const Expr = require('./Expr');

/**
 * Factory function to create instances of an informal type that encapsulates
 * a set of projected search document fields and optional aliases defined as
 * a string or an X DevAPI expression (computed or not).
 * @private
 * @module ProjectedDocumentExprStr
 */

const parser = ExprParser({ type: ExprParser.Type.PROJECTED_SEARCH_EXPR });

/**
 * A document field name and optional alias to include as part of a result set.
 * @typedef {string|module:Expr} ProjectedDocumentExprStr
 * @global
 * @example
 * // string
 * foo.bar.baz as path
 * foo[2].bar as path
 * foo.*.bar as path
 * // X DevAPI expression
 * mysqlx.expr('foo.bar.baz as path')
 * mysqlx.expr('foo[2].bar as path')
 * mysqlx.expr('foo.*.bar as path')
 * mysqlx.expr('{ "foobar": concat(foo, bar) }')
 */

/**
 * One or more document field names and corresponding optional aliases.
 * @typedef {ProjectedDocumentExprStr|ProjectedDocumentExprStr[]} ProjectedDocumentsExprStr
 * @global
 */

/**
 * @private
 * @alias module:ProjectedDocumentExprStr
 * @param {ProjectedDocumentExprStr} value - A String or X DevAPI expression
 * instance containing a field name and an optional alias or a computed
 * projection definition.
 * @returns {module:ProjectedDocumentExprStr}
 */
function ProjectedDocumentExprStr (value) {
    return {
        /**
         * Parses the underlying projected search expression and return
         * the result.
         * @private
         * @function
         * @name module:ProjectedDocumentExprStr#getValue
         * @returns {ExpressionTree} An Object that represents an expression
         * tree that results from parsing a given X DevAPI projected search
         * expression string.
         */
        getValue () {
            const original = Expr({ value }).getExpressionString();
            const projectedDocumentExpr = parser.parse(original);
            const { source, alias } = projectedDocumentExpr;

            // If we are dealing with a computed projection (which is
            // specified as a jsonDoc expression), we should not set
            // an alias.
            if (!alias && source.type !== 'jsonDoc') {
                projectedDocumentExpr.alias = original;
            }

            return projectedDocumentExpr;
        }
    };
}

module.exports = ProjectedDocumentExprStr;
