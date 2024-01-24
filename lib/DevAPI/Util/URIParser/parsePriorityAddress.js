/*
 * Copyright (c) 2017, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const errors = require('../../../constants/errors');
const parsePlainAddress = require('./parsePlainAddress');

module.exports = parse;

/**
 * Parse a single address with an explicit priority.
 * @private
 * @param {string} input - formatted address tuple string
 * @throws {Error} When explicit priorities are not provided for all failover addresses.
 * @throws {Error} When failover address priorities are out of bounds.
 * @returns {Address} Object containing the address details.
 * @example
 * const ipv6Address = '(address=[::1]:33060, 100)'
 * const ipv4Address = '(address=127.0.0.1:33060, 98)'
 * const cnAddress = '(address=localhost:33060, 99)'
 */
function parse (input) {
    const addressMatch = input.trim().match(/^\(?address=([^,]+), ?priority=([\d-]+)\)$/) || [];

    if (!addressMatch[1]) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_MIXED_CONNECTION_ENDPOINT_PRIORITY);
    }

    const address = parsePlainAddress(addressMatch[1]);
    const priority = parseInt(addressMatch[2], 10);

    if (isNaN(priority) || priority < 0 || priority > 100) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_ENDPOINT_PRIORITY_RANGE);
    }

    return Object.assign(address, { priority });
}
