/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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
