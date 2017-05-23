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
        const error = new Error('You must either assign no priority to any of the routers or give a priority for every router');
        error.errno = 4000;

        throw error;
    }

    const address = parsePlainAddress(addressMatch[1]);
    const priority = parseInt(addressMatch[2], 10);

    if (isNaN(priority) || priority < 0 || priority > 100) {
        const error = new Error('The priorities must be between 0 and 100');
        error.errno = 4007;

        throw error;
    }

    return Object.assign(address, { priority });
}
