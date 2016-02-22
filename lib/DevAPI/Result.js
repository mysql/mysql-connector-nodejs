/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

/**
 * SQL Warning
 * @typedef {Object} Warning
 * @property {Number} level
 * @property {Number} code
 * @property {String} msg
 */


/**
 * Result Set information
 * @constructor
 */
function Result(state) {
    this._state = state;
}

module.exports = Result;

// BaseResult

/**
 * Get the number of warnings
 *
 * @returns {Number}
 */
Result.prototype.getWarningsCount = function() {
    return this._state.warnings ? this._state.warnings.length : 0;
};

/**
 * Get an Array of Warnings
 * @returns {Array.<Warning>}
 */
Result.prototype.getWarnings = function() {
    return this._state.warnings || [];
};

/**
 * Get number of items touched by the operation
 * @returns {Number}
 */
Result.prototype.getAffectedItemsCount = function () {
    return this._state.rows_affected || 0;
};

/**
 * Get created auto increment value
 *
 * If multiple rows are inserted this will be the first value generated
 *
 * @returns {Number}
 */
Result.prototype.getAutoIncrementValue = function () {
    return this._state.generated_insert_id;
};

/*
Result.prototype.getLastDocumentId = function () {

};
*/

/**
 * Get number of rows updated
 * @returns {Number}
 */
Result.prototype.getAffectedRowsCount = function () {
    return this._state.rows_affected || 0;
};
