/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

/**
 * Utilities for input validation.
 * @private
 * @module Validator
 */

/**
 * Check if a value is a valid array under the given conditions.
 * @private
 * @returns {boolean}
 */
exports.isValidArray = function ({ required = false, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && !Array.isArray(value)) {
        return false;
    }

    return true;
};

/**
 * Check if a value is a valid boolean under the given conditions.
 * @private
 * @returns {boolean}
 */
exports.isValidBoolean = function ({ required = false, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && typeof value !== 'boolean') {
        return false;
    }

    return true;
};

/**
 * Check if a value is a valid integer under the given conditions.
 * @private
 * @returns {boolean}
 */
exports.isValidInteger = function ({ required = false, max = Number.MAX_SAFE_INTEGER, min = Number.MIN_SAFE_INTEGER, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && !Number.isInteger(value)) {
        return false;
    }

    // By this point, the value is an integer.
    if (value < min || value > max) {
        return false;
    }

    return true;
};

/**
 * Check if a value is a valid plain object under the given conditions.
 * @private
 * @returns {boolean}
 */
exports.isValidPlainObject = function ({ required = false, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    // Since JavaScript arrays are also a type of "object", we need to ensure
    // the value is not one.
    if ((typeof value !== 'undefined' && typeof value !== 'object') || Array.isArray(value) || value === null) {
        return false;
    }

    return true;
};

/**
 * Check if a value is a valid string under the given conditions.
 * @private
 * @returns {boolean}
 */
exports.isValidString = function ({ pattern = '', required = false, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && typeof value !== 'string') {
        return false;
    }

    if (typeof value !== 'undefined' && !(new RegExp(pattern)).test(value)) {
        return false;
    }

    return true;
};
