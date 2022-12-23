/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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

const { isInteger } = require('lossless-json');

/**
 * Utilities for input validation.
 * @private
 * @module Validator
 */

/**
 * Check if a value is a valid array under the given conditions.
 * @private
 * @param {Object} [options]
 * @param {boolean} [options.required=false] - should not be undefined
 * @param {*} [options.value] - value to check
 * @param {function} [options.validator] - validator function to apply for each item in the array
 * @returns {boolean}
 */
function isValidArray ({ required = false, value, validator } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && !Array.isArray(value)) {
        return false;
    }

    // If the value is an array and there is an item validator, we need to
    // validate the items.
    // For now, we assume that if a validator is provided, the array should
    // not be empty and should not contain "undefined" values
    if (typeof value !== 'undefined' && typeof validator === 'function') {
        // If the array is empty, the index validator cannot complete.
        if (!value.length) {
            return false;
        }

        // The index validator only makes sense if the value is not
        // "undefined".
        return value.every(v => validator({ required: true, value: v }));
    }

    return true;
};

/**
 * Check if a value is a valid boolean under the given conditions.
 * @private
 * @param {Object} [options]
 * @param {boolean} [options.required=false] - should not be undefined
 * @param {*} [options.value] - value to check
 * @returns {boolean}
 */
function isValidBoolean ({ required = false, value } = {}) {
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
 * @param {boolean} [required=false] - Whether the value can be undefined.
 * @param {string|number|BigInt} [max=18446744073709551615n] - the maximum
 * integer value, which, by default, the maximum value supported by a
 * MySQL BIGINT UNSIGNED column.
 * @param {string|number|BigInt} [min=-9223372036854775808n] - the minimum
 * integer value, which, by default, the minimum value supported by a
 * MySQL BIGINT SIGNED column.
 * @param {*} [value] - The corresponding value to validate.
 * @returns {boolean}
 */
function isValidInteger ({ required = false, max = 18446744073709551615n, min = -9223372036854775808n, value } = {}) {
    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && !isInteger(value)) {
        return false;
    }

    // By this point, the value is an integer.
    if (typeof value !== 'undefined' && (BigInt(value) < BigInt(min) || BigInt(value) > BigInt(max))) {
        return false;
    }

    return true;
};

/**
 * Check if a value contains valid PEM content in compliance with the code
 * Node.js API to create a secure context.
 * https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options
 * @private
 * @param {Object} [options]
 * @param {boolean} [options.required=false] - should not be undefined
 * @param {*} [options.value] - value to check
 * @returns {boolean}
 */
function isValidPEM ({ required = false, value } = {}) {
    const validPEMPattern = '(-----BEGIN [^-]+-----[^-]+-----END [^-]+-----)+';

    if (typeof value === 'undefined' && required === true) {
        return false;
    }

    if (typeof value !== 'undefined' && !Buffer.isBuffer(value) && !isValidString({ value, pattern: validPEMPattern })) {
        return false;
    }

    return true;
};

/**
 * Check if a value is a valid plain object under the given conditions.
 * @private
 * @param {Object} [options]
 * @param {boolean} [options.required=false] - should not be undefined
 * @param {*} [options.value] - value to check
 * @returns {boolean}
 */
function isValidPlainObject ({ required = false, value } = {}) {
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
 * @param {Object} [options]
 * @param {string} [options.pattern=''] - regular expression pattern to test
 * @param {boolean} [options.required=false] - should not be undefined
 * @param {*} [options.value] - value to check
 * @returns {boolean}
 */
function isValidString ({ pattern = '', required = false, value } = {}) {
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

module.exports = {
    isValidArray,
    isValidBoolean,
    isValidInteger,
    isValidPEM,
    isValidPlainObject,
    isValidString
};
