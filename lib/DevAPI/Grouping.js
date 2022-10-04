/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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

/**
 * This mixin grants aggregation capabilities to a statement instance via
 * composition.
 * @mixin
 * @alias Grouping
 * @param {Object} [constraints] - An object containing internal statement
 * state such as the aggretation criteria.
 * @param {DataModel} [dataModel] - The data model to use for parsing the
 * value when determining between document fields and column identifiers.
 * @param {Preparing} preparable - The instance of the underlying prepable
 * statement.
 * @param {ExpressionTree[]} [groupingList] - A list of expressions used by
 * the statement to aggregate data in the result set.
 * @returns {Grouping}
 */
function Grouping ({ constraints = {}, dataModel, preparable, groupingList = [] }) {
    return {
        /**
         * Retrieves the grouping criteria used by the statement.
         * @function
         * @private
         * @name Grouping#getGroupingCriteria_
         * @returns {ExpressionTree} An instance of a grouping criteria
         * expression.
         */
        getGroupingCriteria_ () {
            return constraints.criteria;
        },

        /**
         * Retrieves the list of columns to aggregate.
         * @function
         * @private
         * @name Grouping#getGroupingList_
         * @returns {string[]} The list of column names.
         */
        getGroupingList_ () {
            return groupingList;
        },

        /**
         * Picks one or more document fields or table columns to be aggregated
         * in the result set.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Grouping#groupBy
         * @param {...SearchExprStrList} [searchExprStrList] - The name of the
         * table columns or document fields to include in the aggregation.
         * @example
         * // arguments as columns group by
         * const query = table.select('foo', 'bar').groupBy('foo asc', 'bar desc')
         *
         * // array of columns to group by
         * const query = table.select('foo', 'bar').groupBy(['foo asc', 'bar desc'])
         * @returns {Grouping} The instance of the statement itself
         * following a fluent API convention.
         */
        groupBy (...searchExprStrList) {
            preparable.forceRestart();

            searchExprStrList.flat().forEach(value => {
                groupingList.push(Expr({ dataModel, value }).getValue());
            });

            return this;
        },

        /**
         * Defines the aggregation criteria for the current statement.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Grouping#having
         * @param {SearchConditionStr} searchConditionStr - The aggregation
         * criteria specified as a string or an X DevAPI expression.
         * @returns {Grouping} The instance of the statement itself
         * following a fluent API convention.
         */
        having (searchConditionStr) {
            preparable.forceRestart();

            constraints.criteria = Expr({ value: searchConditionStr, dataModel }).getValue();

            return this;
        }
    };
}

module.exports = Grouping;
