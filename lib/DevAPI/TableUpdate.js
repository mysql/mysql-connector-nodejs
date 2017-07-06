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
const Expressions = require('../Expressions');
const Result = require('./Result');
const binding = require('./Binding');
const filtering = require('./Filtering');
const limiting = require('./Limiting');

/**
 * TableUpdate factory.
 * @module TableUpdate
 * @mixes Filtering
 * @mixes Binding
 * @mixes Limiting
 */

/**
 * @private
 * @alias module:TableUpdate
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} table - table name
 * @param {string} criteria - criteria expression
 * @returns {TableUpdate}
 */
function TableUpdate (session, schema, table, criteria) {
    let state = Object.assign({ operations: [] }, { session, schema, table });

    return Object.assign({}, filtering({ criteria }), binding(), limiting(), {
        /**
         * Execute update operation.
         * @function
         * @name module:TableUpdate#execute
         * @return {Promise.<Result>}
         */
        execute () {
            if (typeof this.getCriteria() !== 'string' || this.getCriteria().trim().length < 1) {
                return Promise.reject(new Error('update needs a valid condition'));
            }

            return state
                .session
                ._client
                .crudModify(state.schema.getName(), state.table, Client.dataModel.TABLE, this.getCriteria(), state.operations, this.getLimit(), this.getBindings())
                .then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:TableUpdate#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableUpdate';
        },

        /**
         * Add a field to be updated with a new value.
         * @function
         * @name module:TableUpdate#set
         * @param {string} field - field name
         * @param {string} expr - value expression
         * @returns {TableUpdate} The operation instance
         */
        set (field, expr) {
            state.operations.push({
                operation: 1,
                source: {
                    name: field
                },
                value: Expressions.literalOrParsedExpression(expr)
            });

            return this;
        },

        /**
         * Add <code>WHERE</code> clause (set the criteria for picking which rows to update).
         * @function
         * @name module:TableUpdate#where
         * @param {string} criteria - filtering condition
         * @returns {TableUpdate} The operation instance
         */
        where (criteria) {
            return this.setCriteria(criteria);
        }
    });
}

module.exports = TableUpdate;
