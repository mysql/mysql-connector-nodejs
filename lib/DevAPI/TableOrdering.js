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

const ordering = require('./Ordering');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const preparing = require('./Preparing');

/**
 * TableOrdering mixin.
 * @mixin
 * @alias TableOrdering
 * @param {Object} state - ordering properties
 * @returns {Ordering}
 */
function TableOrdering (state) {
    state = Object.assign({ preparable: preparing() }, state);

    return Object.assign({}, ordering(), {
        /**
         * Add <code>ORDER BY</code> clause (set the order options of the result set).
         * @function
         * @name TableOrdering#orderBy
         * @param {...string|string[]} [SortExprStr] - columns (and direction) to sort
         * @throws {Error} When an expression is invalid.
         * @example
         * // arguments as columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy('foo asc', 'bar desc')
         *
         * // array of columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy(['foo asc', 'bar desc'])
         * @returns {TableOrdering} The query instance.
         */
        orderBy () {
            state.preparable.forceRestart();

            return this.setOrderings(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        }
    });
}

module.exports = TableOrdering;
