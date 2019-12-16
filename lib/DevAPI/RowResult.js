/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates. All rights reserved.
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

const Column = require('./Column');
const baseResult = require('./BaseResult');

/**
 * Relational table API for retrieving data.
 * @module RowResult
 * @mixes module:BaseResult
 */

/**
 * @private
 * @alias module:RowResult
 * @param {Object} state - result details
 * @returns {module:RowResult}
 */
function RowResult (state) {
    state = Object.assign({ index: 0, metadata: [], results: [] }, state);

    return Object.assign({}, baseResult(state), {
        /**
         * Retrieve the number of documents affected by the operation.
         * @function
         * @name module:Result#getAffectedItemsCount
         * @returns {number} The number of rows.
         */
        getAffectedItemsCount () {
            return state.rowsAffected;
        },

        /**
         * Consume the current result-set from memory (and flush it).
         * @function
         * @name module:RowResult#fetchAll
         * @example
         * table.select()
         *   .execute()
         *   .then(res => {
         *     // get the list of documents in the result set
         *     var rows = res.fetchAll()
         *   })
         *
         * session.sql("SELECT 'foo'")
         *   .execute()
         *   .then(res => {
         *     console.log(res.fetchAll()) // [['foo']]
         *   })
         * @returns {Array<Array>} A list of rows.
         */
        fetchAll () {
            if (!state.results || !state.results.length) {
                return [];
            }

            const current = state.results[state.index] || [];

            if (current.length) {
                state.results[state.index] = null;
            }

            // fetchOne() might have been called already.
            const lastNullable = current.lastIndexOf(null);
            const startIndex = lastNullable > -1 ? lastNullable + 1 : 0;

            return current.slice(startIndex, current.length);
        },

        /**
         * Consume a single result-set row from memory (and flush it).
         * @function
         * @name module:RowResult#fetchOne
         * @example
         * table.select()
         *   .execute()
         *   .then(res => {
         *     // iterate over the documents in the result set
         *     while (var row = res.fetchOne()) {
         *       // do something with the current document
         *     }
         *   })
         *
         * session.sql("SELECT 'foo'")
         *   .execute()
         *   .then(res => {
         *     console.log(res.fetchOne()) // ['foo']
         *   })
         * @returns {Array} A row.
         */
        fetchOne () {
            if (!state.results || !state.results.length) {
                return;
            }

            const current = state.results[state.index] || [];

            let i = 0;

            while (i < current.length) {
                if (current[i]) {
                    // consume the current item in the result-set and deallocate the memory
                    const res = current[i];
                    current[i] = null;

                    if (i === current.length - 1) {
                        // the result-set has been entirely consumed and the memory can be deallocated
                        state.results[state.index] = null;
                    }

                    return res;
                }

                ++i;
            }
        },

        /**
         * Retrieve the list of [columns]{@link module:Column} that are part of the result-set.
         * @function
         * @name module:RowResult#getColumns
         * @example
         * session.sql("SELECT 'foo' AS name")
         *   .execute()
         *   .then(res => {
         *     var columns = res.getColumns()
         *     console.log(columns[0].getColumnLabel()) // name
         *   })
         * @returns {Array<module:Column>} A list of [columns]{@link module:Column}.
         */
        getColumns () {
            const columns = state.metadata[state.index] || [];

            return columns.map(m => new Column(m));
        },

        /**
         * Retrieve the entire result-set (without flushing).
         * @function
         * @name module:RowResult#getResults
         * @returns {Array<Array<Array>>}
         */
        getResults () {
            return state.results;
        },

        /**
         * Move to the next available result-set.
         * @function
         * @name module:RowResult#nextResult
         * @example
         * // CREATE PROCEDURE proc() BEGIN
         * //   SELECT 'foo' as name;
         * //   SELECT 'bar' as name;
         * // END
         * session.sql('CALL proc()')
         *   .execute()
         *   .then(res => {
         *     // iterate over multiple result sets
         *     do {
         *       console.log(res.fetcOne())
         *     } while (res.nextResult())
         *   })
         * @returns {boolean}
         */
        nextResult () {
            state.index += 1;

            if (!state.results || !state.results.length || !state.results[state.index]) {
                return false;
            }

            return true;
        },

        /**
         * Returns the current result-set (without flushing) as a JavaScript Arrray.
         * @function
         * @name module:RowResult#toArray
         * @returns {Array}
         */
        toArray () {
            return state.results[state.index];
        }
    });
}

module.exports = RowResult;
