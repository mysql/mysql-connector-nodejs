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

const crypto = require('crypto');

/**
 * @module UUID
 * @private
 */

/**
 * Create a custom UUID generator inspired by RFC 4122.
 * @returns {string} A serializable hexadecimal string.
 * @example
 * const standardUUID = 5C99CDfE-48CB-11E6-94F3-4A383B7fCC8B
 * const customUUID = 4A383B7FCC8B-94F3-11E6-48CB-5C99CDFE
 */
function UUID () {
    const nodeId = node();

    return function () {
        return `${nodeId}${clockSequence()}${timestamp()}`.toUpperCase();
    };
}

/**
 * Generate an UUID v1 random Node ID.
 * @returns {string} A serializable hexadecimal string.
 */
function node () {
    const noise = random(6);
    // Node IDs that don't identify the host must have the LSB of the first octet
    // equal to `1`, as specified by RFC 4122 (https://www.ietf.org/rfc/rfc4122.txt).
    // Since bitwise operations in JavaScript are very slow, they are reduced to
    // the smallest possible unit (a single octet).
    const randomnessOctet = parseInt(`0x${noise[1]}`) | 1; // decimal
    const result = `${noise[0]}${randomnessOctet.toString(16)}${noise.substring(2, noise.length)}`;

    return result;
}

/**
 * Generate an UUID v1 clock sequence number.
 * @returns {string} A serializable hexadecimal string.
 */
function clockSequence () {
    const noise = random(2);
    // The variant number requires the MSB of the clock-sequence to equal `10`,
    // as specified by RFC 4122 (https://www.ietf.org/rfc/rfc4122.txt).
    // Since bitwise operations in JavaScript are very slow, they are reduced to
    // the smallest possible unit (a single octet).
    const variantOctet = (parseInt(`0x${noise.substring(0, 1)}`) | 8) & 11; // decimal
    const result = `${variantOctet.toString(16)}${noise.substring(1, noise.length)}`;

    return result;
}

/**
 * Generate an UUID v1 timestamp.
 * @returns {string} A serializable hexadecimal string.
 */
function timestamp () {
    const gregorianReform = Date.UTC(1582, 9, 15);
    const diffInNanos = (Date.now() - gregorianReform) * 1000000;
    const intervals = diffInNanos / 100;
    // The version number is in the most significant 4 bits of the timestamp,
    // as specified by RCF RFC 4122 (https://www.ietf.org/rfc/rfc4122.txt).
    // Bitwise operations are avoided altogether.
    const versionOctet = 1; // decimal
    const result = `${versionOctet}${intervals.toString(16)}`;

    return result;
}

/**
 * Generate a high-quality pseudo-random number.
 * @param {number} size - the number of octets
 * @returns {string} A serializable hexadecimal string
 */
function random (size) {
    return crypto.randomBytes(size).toString('hex');
}

module.exports = UUID;
