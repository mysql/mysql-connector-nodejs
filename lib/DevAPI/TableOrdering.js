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

const SortExprStr = require('./SortExprStr');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;

/**
 * This mixin grants sorting capabilities to a table statement instance via
 * composition.
 * @mixin
 * @alias TableOrdering
 * @param {ExpressionTree[]} [orderList] - A list of order expression
 * instances for one ore more table columns.
 * @param {Preparing} preparable - The instance of the underlying prepared
 * statement.
 * @returns {TableOrdering}
 */
function TableOrdering ({ orderList = [], preparable }) {
    return {
        /**
         * Retrieves the list of ordering expressions associated to a given
         * table statement.
         * @private
         * @function
         * @name Filtering#getOrderList_
         * @returns {ExpressionTree[]} The List of order expression instances.
         */
        getOrderList_ () {
            return orderList;
        },

        /**
         * Establishes the order of one or more specific columns in the result
         * set.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name TableOrdering#orderBy
         * @param {...SortExprStrList} [sortExprStrList] - One or more
         * expressions establishing the order on which the given columns
         * are sorted.
         * @example
         * // arguments as columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy('foo asc', 'bar desc')
         *
         * // array of columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy(['foo asc', 'bar desc'])
         * @returns {TableOrdering} The Instance of the statement itself
         * following a fluent API convention.
         */
        orderBy (...sortExprStrList) {
            preparable.forceRestart();

            sortExprStrList.flat().forEach(sortExprStr => {
                orderList.push(SortExprStr({ dataModel, value: sortExprStr }).getValue());
            });

            return this;
        }
    };
}

module.exports = TableOrdering;
