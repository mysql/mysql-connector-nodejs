/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

const Client = require('../Protocol/Client');
const Column = require('./Column');
const Result = require('./Result');
const binding = require('./Binding');
const filtering = require('./Filtering');
const limiting = require('./Limiting');
const locking = require('./Locking');
const parseExpressionInputs = require('./Util/parseExpressionInputs');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');

/**
 * TableSelect factory.
 * @module TableSelect
 * @mixes Filtering
 * @mixes Binding
 * @mixes Limiting
 * @mixes Locking
 */

/**
 * @private
 * @alias module:TableSelect
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} table - table name
 * @param {Array.<string>} projection - projection expressions
 * @returns {TableSelect}
 */
function TableSelect (session, schema, table, projection) {
    let state = Object.assign({ joins: [] }, { session, schema, table, projection });

    return Object.assign({}, filtering(), binding(), limiting(), locking(), {
        /**
         * Execute find operation.
         * @function
         * @name module:TableSelect#execute
         * @param {documentCallback} [rowcb]
         * @param {Array<Column>} [metacb]
         * @return {Promise.<Result>}
         */
        execute (rowcb, metacb) {
            return state
                .session
                ._client
                .crudFind(state.session, state.schema.getName(), state.table, Client.dataModel.TABLE, parseExpressionInputs(state.projection), this.getCriteria(), state.groupby, state.having, state.orderby, this.getLimit(), rowcb, Column.metaCB(metacb), this.getBindings(), state.joins, this.getLockingMode())
                .then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:TableSelect#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableSelect';
        },

        /**
         * Retrieve the grouping options.
         * @function
         * @name module:TableSelect#getGroupBy
         * @returns {object} An object with the grouping options.
         */
        getGroupBy () {
            return state.groupby;
        },

        /**
         * Retrieve the sorting options.
         * @function
         * @name module:TableSelect#getOrderBy
         * @returns {object} An object with the sorting options.
         */
        getOrderBy () {
            return state.orderby;
        },

        /**
         * Retrieve the projection map.
         * @function
         * @name module:TableSelect#getProjection
         * @returns {object} An object containing the project map.
         */
        getProjection () {
            return state.projection;
        },

        /**
         * Build a view for the operation.
         * @function
         * @name module:TableSelect#getViewDefinition
         * @returns {string} The view SQL string.
         */
        getViewDefinition () {
            // TODO(rui.quelhas): check if this is the best place to escape the interpolated properties
            // console.log(Table, new Table(), Table.escapeIdentifier);
            // let retval = "SELECT " + state.projection.join(", ") + " FROM " + Table.escapeIdentifier(state.schema.getName()) + '.' + Table.escapeIdentifier(state.table);
            let view = `SELECT ${state.projection.join(', ')} FROM ${state.schema.getName()}.${state.table}`;

            if (this.getCriteria()) {
                view = `${view} WHERE ${this.getCriteria()}`;
            }

            if (state.orderby) {
                view = `${view} ORDER BY ${state.orderby.join(', ')}`;
            }

            return view;
        },

        /**
         * Add <code>GROUP BY</code> clause (set the grouping options of the result set).
         * @function
         * @name module:TableSelect#groupBy
         * @param {...string|string[]} [GroupByExprStr] - columns to group by
         * @throws {Error} When an expression is invalid.
         * @example
         * // arguments as columns group by
         * const query = table.select('foo', 'bar').groupBy('foo asc', 'bar desc')
         *
         * // array of columns to group by
         * const query = table.select('foo', 'bar').groupBy(['foo asc', 'bar desc'])
         * @returns {TableSelect} The operation instance
         */
        groupBy () {
            state.groupby = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            return this;
        },

        /**
         * Add <code>HAVING</code> clause.
         * @function
         * @name module:TableSelect#having
         * @param {SearchConditionStr} expr - filtering criteria
         * @returns {TableSelect} The operation instance
         */
        having (expr) {
            state.having = expr;

            return this;
        },

        /**
         * Add <code>ORDER BY</code> clause (set the order options of the result set).
         * @function
         * @name module:TableSelect#orderBy
         * @param {...string|string[]} [SortExprStr] - columns (and direction) to sort
         * @throws {Error} When an expression is invalid.
         * @example
         * // arguments as columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy('foo asc', 'bar desc')
         *
         * // array of columns (and direction) to sort
         * const query = table.select('foo', 'bar').orderBy(['foo asc', 'bar desc'])
         * @returns {TableSelect} The operation instance
         */
        orderBy () {
            state.orderby = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            return this;
        },

        /**
         * Add <code>WHERE</code> clause (set the criteria for which rows to pick).
         * @function
         * @name module:TableSelect#where
         * @param {SearchConditionStr} criteria - filtering criteria
         * @returns {TableSelect} The operation instance
         */
        where (criteria) {
            return this.setCriteria(criteria);
        }
    });
}

module.exports = TableSelect;
