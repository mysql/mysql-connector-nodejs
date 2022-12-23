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
const JSON = require('../json');

/**
 * Factory function to create instances of an informal type that represents
 * a local document instance.
 * @private
 * @module DocumentOrJSON
 */

const jsonDocParser = ExprParser({ type: ExprParser.Type.JSON_DOC });

/**
 * A document definition as represented by a plain JavaScript object, a JSON
 * string or an X DevAPI expression instance.
 * @typedef {Object|string|module:Expr} DocumentOrJSON
 * @global
 * @example
 * // literal object
 * { foo: 'bar' }
 * // JSON string
 * '{ "foo": "bar" }'
 * // X DevAPI expression
 * mysqlx.expr('{"foo":"bar"}')
 */

/**
 * One or more document definitions.
 * @typedef {DocumentOrJSON|DocumentOrJSON[]} DocumentsOrJSON
 * @global
 */

/**
 * @private
 * @alias module:DocumentOrJSON
 * @param {DocumentOrJSON} value - A plain JavaScript object, JSON string or
 * an X DevAPI expression instance that represents a document definition.
 * @returns {module:DocumentOrJSON}
 */
function DocumentOrJSON (value) {
    return {
        /**
         * Parses the underlying expression and return the result.
         * @private
         * @function
         * @name module:DocumentOrJSON#getValue
         * @returns {Object|ExpressionTree} A plain JavaScript object which
         * represents the document instance. The object can be an expression
         * tree that results from parsing a given X DevAPI expression instance.
         */
        getValue () {
            if (typeof value === 'string') {
                return JSON({ unsafeNumberAsString: true }).parse(value);
            }

            if (!this.isLiteral()) {
                return jsonDocParser.parse(Expr({ value }).getExpressionString());
            }

            return value;
        },

        /**
         * Checks if the underlying expression is a literal string or an X
         * DevAPI expression.
         * @private
         * @function
         * @name module:DocumentOrJSON#isLiteral
         * @returns {boolean}
         */
        isLiteral () {
            return Expr({ value }).isLiteral();
        }
    };
}

module.exports = DocumentOrJSON;
