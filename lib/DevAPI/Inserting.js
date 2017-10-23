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

/**
 * Inserting mixin.
 * @mixin
 * @private
 * @alias Inserting
 * @param {Object} state - Inserting properties
 * @returns {Inserting}
 */
function Inserting (state) {
    state = Object.assign({ columns: [], items: [], upsert: false }, state);

    return {
        /**
         * Retrieve the list of column names to map when inserting data.
         * @function
         * @name Inserting#getColumns
         * @returns {string[]} The list of column names.
         */
        getColumns () {
            return state.columns;
        },

        /**
         * Retrieve the list of rows or documents to insert.
         * @function
         * @name Inserting#getItems
         * @returns {Object[]|Array[]} The list of items.
         */
        getItems () {
            return state.items;
        },

        /**
         * Check if the query is an "upsert".
         * @function
         * @name Inserting#isUpsert
         * @returns {boolean}
         */
        isUpsert () {
            return state.upsert;
        },

        /**
         * Set the list of rows or documents to insert.
         * @function
         * @name Inserting#setItems
         * @param {Object[]|Array[]} items - item list
         * @returns {Inserting} The query instance.
         */
        setItems (items) {
            state.items = items;

            return this;
        }
    };
}

module.exports = Inserting;
