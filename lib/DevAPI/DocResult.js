/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
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

const baseResult = require('./BaseResult');

/**
 * API for Document Store retrieval operations.
 * @module DocResult
 */

/**
 * @alias module:DocResult
 * @param {Object} state - result details
 * @returns {module:DocResult}
 */
function DocResult (state) {
    state = Object.assign({ results: [] }, state);

    return Object.assign({}, baseResult(state), {
        /**
         * Consume the current result-set from memory (and flush it).
         * @function
         * @name module:RowResult#fetchAll
         * @returns {Array<Object>} A list of documents.
         */
        fetchAll () {
            if (!state.results || !state.results.length) {
                return [];
            }

            const items = state.results.splice(0, 1)[0];

            if (!items || !items.length) {
                return [];
            }

            return items.map(item => item[0]);
        },

        /**
         * Consume a single result-set document from memory (and flush it).
         * @function
         * @name module:RowResult#fetchOne
         * @returns {Object} A document.
         */
        fetchOne () {
            if (!state.results || !state.results.length) {
                return;
            }

            const item = state.results[0].splice(0, 1)[0];

            if (!item || !item.length) {
                return;
            }

            return item[0];
        },

        /**
         * Returns the result-set (without flushing) as a JavaScript Arrray.
         * @function
         * @name module:SqlResult#toArray
         * @returns {Array}
         */
        toArray () {
            if (!state.results || !state.results.length) {
                return [];
            }

            return state.results[0].map(item => item[0]);
        }
    });
}

module.exports = DocResult;
