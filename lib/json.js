/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

const { isNumber, isSafeNumber, parse, stringify, isInteger } = require('lossless-json');

/**
 * Custom JSON module that extends the functionality provided by the native
 * JSON object.
 * @private
 * @param {boolean} [unsafeNumberAsString] - An option used to instruct
 * the parser to return unsafe numeric values as JavaScript strings.
 * @returns {Object} The plain JavaScript object version of the JSON string.
 */
module.exports = ({ anyIntegerAsBigInt = false, unsafeNumberAsString = false, anyNumberAsString = false, unsafeIntegerAsBigInt = false } = {}) => ({
    /**
     * Parse the JSON string as a plain JavaScript object given specific
     * transformation rules for large numeric values which loose precision
     * if represented as JavaScript numbers.
     * @private
     * @param {string} json - A valid JSON string.
     * @returns A plain JavaScript object.
     */
    parse (json) {
        return parse(json, null, x => {
            if (isInteger(x) && anyIntegerAsBigInt) {
                return BigInt(x);
            }

            if (isInteger(x) && !isSafeNumber(x) && unsafeIntegerAsBigInt) {
                return BigInt(x);
            }

            if (isNumber(x) && !isSafeNumber(x) && unsafeNumberAsString) {
                return x;
            }

            if (isNumber(x) && !anyNumberAsString) {
                return Number(x);
            }

            return x;
        });
    },

    // For now, the original "stringify" method can be used.
    stringify
});
