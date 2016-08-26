/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

/**
 * Get a single document id
 *
 * Throws an exception if multiple documents where added
 *
 * @throws {Error}
 * @returns {String}
 */
Result.prototype.getDocumentId = function () {
    if (this._state.doc_ids.length !== 1) {
        throw new Error("getDocumentId() can only be called when only one document was added, use getDocumentIds() instead");
    }
    return this._state.doc_ids[0];
};

/**
 * Get the ids generated for new documents in a collection
 * @returns {Array.<String>}
 */
Result.prototype.getDocumentIds = function () {
    return this._state.doc_ids;
};

/**
 * Get number of rows updated
 * @returns {Number}
 */
Result.prototype.getAffectedRowsCount = function () {
    return this._state.rows_affected || 0;
};
