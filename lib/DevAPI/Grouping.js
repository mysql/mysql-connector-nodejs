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

const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const preparing = require('./Preparing');

/**
 * Grouping mixin.
 * @mixin
 * @alias Grouping
 * @param {Object} state - grouping properties
 * @returns {Grouping}
 */
function Grouping (state) {
    state = Object.assign({ criteria: 'true', groupings: [], preparable: preparing() }, state);

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
            state.preparable.forceRestart();

            return this.setGroupings(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        },

        /**
         * Determine if the grouping criteria expression needs to be parsed.
         * @function
         * @private
         * @name Grouping#hasBaseGroupingCriteria
         * @returns {boolean}
         */
        hasBaseGroupingCriteria () {
            const criteria = (state.criteria || '').toString().trim().toLowerCase();

            return !criteria.length || criteria === 'true';
        },

        /**
         * Add <code>HAVING</code> clause.
         * @function
         * @name Grouping#having
         * @param {SearchConditionStr} expr - filtering criteria
         * @returns {Grouping} The query instance.
         */
        having (criteria) {
            state.preparable.forceRestart();

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
