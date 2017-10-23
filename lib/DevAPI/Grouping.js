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

const parseFlexibleParamList = require('./Util/parseFlexibleParamList');

/**
 * Grouping mixin.
 * @mixin
 * @alias Grouping
 * @param {Object} state - grouping properties
 * @returns {Grouping}
 */
function Grouping (state) {
    state = Object.assign({ criteria: 'true', groupings: [] }, state);

    return {
        /**
         * Retrieve the query grouping criteria.
         * @function
         * @private
         * @name Grouping#getGroupingCriteria
         * @returns {string} The criteria expression string.
         */
        getGroupingCriteria () {
            return state.criteria;
        },

        /**
         * Retrieve the list of columns to group.
         * @function
         * @private
         * @name Grouping#getGroupings
         * @returns {string[]} The list of column names.
         */
        getGroupings () {
            return state.groupings;
        },

        /**
         * Add <code>GROUP BY</code> clause (set the grouping options of the result set).
         * @function
         * @name Grouping#groupBy
         * @param {...string|string[]} [GroupByExprStr] - columns to group by
         * @throws {Error} When an expression is invalid.
         * @example
         * // arguments as columns group by
         * const query = table.select('foo', 'bar').groupBy('foo asc', 'bar desc')
         *
         * // array of columns to group by
         * const query = table.select('foo', 'bar').groupBy(['foo asc', 'bar desc'])
         * @returns {Grouping} The query instance.
         */
        groupBy () {
            return this.setGroupings(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        },

        /**
         * Add <code>HAVING</code> clause.
         * @function
         * @name Grouping#having
         * @param {SearchConditionStr} expr - filtering criteria
         * @returns {Grouping} The query instance.
         */
        having (criteria) {
            return this.setGroupingCriteria(criteria);
        },

        /**
         * Set the query grouping criteria.
         * @function
         * @private
         * @name Grouping#setGroupingCriteria
         * @param {string} criteria - expression string
         * @returns {Grouping} The query instance.
         */
        setGroupingCriteria (criteria) {
            state.criteria = criteria;

            return this;
        },

        /**
         * Set the list of columns to group.
         * @function
         * @private
         * @name Grouping#setGroupings
         * @param {string[]} groupings - list of column names
         * @returns {Grouping} The query instance.
         */
        setGroupings (groupings) {
            state.groupings = groupings;

            return this;
        }
    };
}

module.exports = Grouping;
