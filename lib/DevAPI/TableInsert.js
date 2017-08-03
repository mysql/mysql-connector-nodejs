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
const Result = require('./Result');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');

/**
 * TableInsert factory.
 * @module TableInsert
 * @mixes Filtering
 * @mixes Limiting
 */

/**
 * @private
 * @alias module:TableInsert
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} table - table name
 * @param {Array.<string>} fields - projection
 * @returns {TableInsert}
 */
function TableInsert (session, schema, table, fields) {
    let state = Object.assign({ rows: [] }, { session, schema, table, fields });

    return {
        /**
         * Execute the insert operation.
         * @function
         * @name module:TableInsert#execute
         * @returns {Promise.<Result>}
         */
        execute () {
            const columns = state.fields.map(field => ({ name: field }));
            const rows = state.rows;

            return state
                .session
                ._client
                .crudInsert(state.schema.getName(), state.table, Client.dataModel.TABLE, { columns, rows })
                .then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:TableInsert#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableInsert';
        },

        /**
         * Retrieve the set of columns.
         * @function
         * @name module:TableInsert#getFields
         * @returns {Array.<string>}
         */
        getFields () {
            return state.fields;
        },

        /**
         * Retrieve the set of row values.
         * @function
         * @name module:TableInsert#getRows
         * @returns {Promise.<Result>}
         */
        getRows () {
            return state.rows;
        },

        /**
         * Set row values.
         * @function
         * @name module:TableInsert:values
         * @param {...string|string[]} ExprOrLiteral - column values
         * @throws {Error} When there is a mismatch with the number columns in the query.
         * @example
         * // arguments as column values
         * table.insert('foo', 'bar').values('baz', 'qux')
         * table.insert(['foo', 'bar']).values('baz', 'qux')
         *
         * // array of column values
         * table.insert('foo', 'bar').values(['baz', 'qux'])
         * table.insert(['foo', 'bar']).values(['baz', 'qux'])
         *
         * // comma-separated string with column values
         * table.insert('foo', 'bar').values('baz, qux'])
         * table.insert(['foo', 'bar']).values('baz, qux')
         *
         * // chaining multiple inserts
         * table.insert('foo', 'bar')
         *      .values(['baz', 'qux'])
         *      .values(['quux', 'biz'])
         *      .values('foo, bar')
         * @returns {TableInsert} The operation instance
         */
        values () {
            const values = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            if (state.fields.length !== values.length) {
                throw new Error(`Mismatch in column count. ${state.fields.length} fields listed, ${values.length} values provided`);
            }

            state.rows.push(values);

            return this;
        }
    };
}

module.exports = TableInsert;
