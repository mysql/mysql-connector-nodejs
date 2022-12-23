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

const int64 = require('./int64');

/**
 * @private
 * @alias module:adapters.Mysqlx.uint64
 * @param {number|string|BigInt} value - An integer representation.
 * @returns {module:adapters.Mysqlx.uint64}
 */
function uint64 (value) {
    return int64(value);
}

/**
 * Create a protobuf uint64 wrapper representation.
 * @param {BigInt} value - A JavaScript BigInt containing the representation
 * of a protobuf uint64 field type. @see {Scalar.toLiteral}
 * @param {int64.Type} [type] - The integer conversion mode.
 * @returns {module:adapters.Protobuf.uint64}
 */
uint64.create = (value, { type } = {}) => {
    switch (type) {
    case int64.Type.BIGINT:
        return uint64(value);
    case int64.Type.STRING:
        return uint64(value.toString());
    case int64.Type.UNSAFE_BIGINT:
        return value <= Number.MAX_SAFE_INTEGER ? uint64(Number(value)) : uint64(value);
    case int64.Type.UNSAFE_STRING:
    default:
        return value <= Number.MAX_SAFE_INTEGER ? uint64(Number(value)) : uint64(value.toString());
    }
};

/**
 * Decode an integer value encoded as a string (default protobuf behavior for
 * uint64 fields).
 * @private
 * @param {string} rawString - A string containing a uint64 or sint64 protobuf
 * value.
 * @param {int64.Type} [type] - The conversion mode selected by the
 * application to handle downstream integer values in the current session.
 * @returns {number|string|BigInt} A JavaScript number, string ot BigInt
 * depending on the value of "type".
 */
uint64.deserialize = (rawString, { type } = {}) => {
    const bigInt = BigInt(rawString);

    if (bigInt <= Number.MAX_SAFE_INTEGER && type !== int64.Type.BIGINT && type !== int64.Type.STRING) {
        return Number(bigInt);
    }

    // either the number is unsafe or needs to be converted to a BigInt or string
    if (type === int64.Type.BIGINT || type === int64.Type.UNSAFE_BIGINT) {
        return bigInt;
    }

    return rawString;
};

uint64.Type = int64.Type;

module.exports = uint64;
