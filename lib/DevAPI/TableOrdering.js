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

const ordering = require('./Ordering');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');

/**
 * TableOrdering mixin.
 * @mixin
 * @alias TableOrdering
 * @param {Object} state - ordering properties
 * @returns {Ordering}
 */
function TableOrdering (state) {
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
            return this.setOrderings(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        }
    });
}

module.exports = TableOrdering;
