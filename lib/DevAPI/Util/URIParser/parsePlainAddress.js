/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

module.exports = parse;

/**
 * Parse a single address without an explicit priority.
 * @private
 * @param {string} input - formatted address string
 * @throws {Error} When the host is not valid.
 * @returns {Address} Object containing the address details.
 * @example
 * const ipv6Address = '[::1]:33060'
 * const ipv4Address = '127.0.0.1:33060'
 * const cnAddress = 'localhost:33060'
 */
function parse (input) {
    // hostMatch will always contain something
    const hostMatch = decodeURIComponent(input).trim().match(/\(?([./][^)]+)\)?|\[(.+)\]|([^:]+)/);
    const portMatch = decodeURIComponent(input).trim().match(/:([^[\]]+)$/) || [];

    const isValid = isLocalFile(hostMatch[1]) ||
        isIPv6(hostMatch[2]) ||
        isIPv4(hostMatch[3]) ||
        isCommonName(hostMatch[3]);

    if (!isValid) {
        throw new Error('Invalid URI');
    }

    const socket = hostMatch[1];

    // hostMatch[1] should contain an IPv6 address match
    // hostMatch[2] should contain a non-IPv6 address match
    const host = hostMatch[2] || hostMatch[3];

    const address = { host, socket };
    const portNum = parseInt(portMatch[1], 10);
    address.port = !isNaN(portNum) ? portNum : portMatch[1];

    return address;
}

/**
 * Check if a host is a valid IPv6 address.
 * @private
 * @param {string} input - host
 * @returns {Boolean}
 */
function isIPv6 (input) {
    if (!input) {
        return false;
    }

    const decOctet = '([0-9]|[1-9][0-9]|1[0-9]{0,2}|2[0-4][0-9]|25[0-5])';
    const h16 = '([0-9A-Fa-f]{1,4})';
    const ipv4Address = `(${decOctet}\\.){3}${decOctet}`;
    const ls32 = `(${h16}:${h16}|${ipv4Address})`;
    const ipv6Address = [
        `(${h16}:){6}${ls32}`,
        `(::${h16}:){5}${ls32}`,
        `${h16}?::(${h16}:){4}${ls32}`,
        `(${h16}:)?${h16}?::(${h16}:){3}${ls32}`,
        `(${h16}:){0,2}${h16}?::(${h16}:){2}${ls32}`,
        `(${h16}:){0,3}${h16}?::${h16}:${ls32}`,
        `(${h16}:){0,4}${h16}?::${ls32}`,
        `(${h16}:){0,5}${h16}?::${h16}`,
        `(${h16}:){0,6}${h16}?::`
    ].join('|');

    return (new RegExp(ipv6Address)).test(input);
}

/**
 * Check if a host is a valid IPv4 address.
 * @private
 * @param {string} input - host
 * @returns {Boolean}
 */
function isIPv4 (input) {
    if (!input) {
        return false;
    }

    const decOctet = '([0-9]|[1-9][0-9]|1[0-9]{0,2}|2[0-4][0-9]|25[0-5])';
    const ipv4Address = `^(${decOctet}\\.){3}${decOctet}$`;

    return (new RegExp(ipv4Address)).test(input);
}

/**
 * Check if a host is a valid common name (RFC 3896 `reg-name`).
 * @private
 * @param {string} input - host
 * @returns {Boolean}
 */
function isCommonName (input) {
    if (!input) {
        return false;
    }

    return (new RegExp('^[a-zA-Z0-9-._~!$&\'()*+,;=]+$')).test(input);
}

/**
 * Check if a host is a valid local file path.
 * @private
 * @param {string} input - local file path
 * @returns {Boolean}
 */
function isLocalFile (input) {
    if (!input) {
        return false;
    }

    return (new RegExp('^.{0,2}/[a-zA-Z0-9-._~!$&\'()*+,;=]+')).test(input);
}
