/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
         * @private
         * @name Inserting#getColumns
         * @returns {string[]} The list of column names.
         */
        getColumns () {
            return state.columns;
        },

        /**
         * Retrieve the list of rows or documents to insert.
         * @function
         * @private
         * @name Inserting#getItems
         * @returns {Object[]|Array[]} The list of items.
         */
        getItems () {
            return state.items;
        },

        /**
         * Check if the query is an "upsert".
         * @function
         * @private
         * @name Inserting#isUpsert
         * @returns {boolean}
         */
        isUpsert () {
            return state.upsert;
        },

        /**
         * Set the list of rows or documents to insert.
         * @function
         * @private
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
