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
const parsePriorityAddress = require('./parsePriorityAddress');

module.exports = parse;

/**
 * Address object.
 * @private
 * @typedef {Object} Address
 * @prop {string} host - address host
 * @prop {number} [port] - address port
 */

/**
 * Parse a list of failover addresses.
 * @private
 * @param {string} input - formatted string with a list of addresses (check examples)
 * @throws {Error} When explicit priorities are not provided for all failover addresses.
 * @throws {Error} When failover address priorities are out of bounds.
 * @returns {Address[]} The list of objects containing the details of each address.
 * @example
 * // list of addresses without priority
 * const addressList = '[::1:33060, localhost:33060, 127.0.0.1:33060]'
 * // list of addresses with priority
 * const priorityAddressList = '[(address=[::1], priority=100), (adddress=localhost, priority=99), (address=127.0.0.1, priority=98)]'
 */
function parse (input) {
    const addressListMatch = input.trim().match(/^\[(.+)\]$/) || [];
    const expressions = addressListMatch[1] || '';

    let addresses = parseAddressListWithPriority(expressions);

    if (addresses && addresses.length) {
        return addresses;
    }

    addresses = parseAddressListWithoutPriority(expressions);

    if (addresses && addresses.length) {
        return addresses;
    }

    return [parsePlainAddress(input)];
}

/**
 * Parse an unordered list of failover addresses with an explicit priority.
 * @private
 * @param {string} input - formatted string with a list of addresses (check examples)
 * @throws {Error} When explicit priorities are not provided for all failover addresses.
 * @returns {Address[]} Ordered list of addresses.
 * @example
 * const addressList = '[(address=[::1], priority=100), (address=localhost, priority=99), (address=127.0.0.1, priority=98)]'
 */
function parseAddressListWithPriority (input) {
    const items = input.trim().match(/[^ (),]+/g) || [];
    const tuples = input.trim().match(/\(([^)]+)\)/g) || [];

    if (tuples.length && items.length && items.length % 2 !== 0) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_MIXED_CONNECTION_ENDPOINT_PRIORITY);
    }

    return tuples.reduce((result, tuple) => result.concat(parsePriorityAddress(tuple)), []);
}

/**
 * Parse a an ordered list of failover addresses without an explicit priority.
 * @private
 * @param {string} input - formatted string with a list of addresses (check examples)
 * @throws {Error} When the host is not valid.
 * @returns {Address[]} List of addresses.
 * @example
 * const addressList = '[[::1]:33060, localhost:33060, 127.0.0.1:33060]'
 */
function parseAddressListWithoutPriority (input) {
    const singles = input.trim().match(/[^,]+/g) || [];

    return singles.length > 1 ? singles.map(parsePlainAddress) : [];
}
