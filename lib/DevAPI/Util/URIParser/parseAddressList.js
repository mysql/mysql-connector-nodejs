/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

'use strict';

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
 * const priorityAddressList = '[([::1]:33060, 100), (localhost:33060, 99), (127.0.0.1:33060, 98)]'
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
 * const addressList = '[([::1]:33060, 100), (localhost:33060, 99), (127.0.0.1:33060, 98)]'
 */
function parseAddressListWithPriority (input) {
    const items = input.trim().match(/[^ (),]+/g) || [];
    const tuples = input.trim().match(/\(([^)]+)\)/g) || [];

    if (tuples.length && items.length && items.length % 2 !== 0) {
        const error = new Error('You must either assign no priority to any of the routers or give a priority for every router');
        error.errno = 4000;

        throw error;
    }

    return tuples
        .reduce((result, tuple) => result.concat(parsePriorityAddress(tuple)), [])
        .sort((a, b) => b.priority - a.priority)
        // TODO(Rui): use object destructuring on node >= 6.0.0
        .map(tuple => Object.assign({}, { host: tuple.host, port: tuple.port, socket: tuple.socket }));
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
