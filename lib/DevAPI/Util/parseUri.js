/*
 * Copyright (c) 2015-2017, Oracle and/or its affiliates. All rights reserved.
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

const assert = require('assert');
const qs = require('querystring');

/**
 * Parse a URI string.
 * @private
 * @param {string} uri - RFC 3986 URI or unified connection string
 * @throws {Error} When the format is not valid.
 * @throws {Error} When no valid host is provided.
 * @throws {Error} When explicit priorities are not provided for all failover addresses.
 * @throws {Error} When failover address priorities are out of bounds.
 * @returns {URI} Object containing the URI details.
 */
function parseUri (uri) {
    const basePattern = /^(([^+:]+)\+?([^:]+)?:\/\/)?([^/?]+)(\/[^?]*)?(\?.*)?$/;
    const base = uri.trim().match(basePattern);

    // Bare-minimum requirements: host
    assert(base && base[4], 'Invalid URI');

    const authorityPattern = /^([^@]+@)?(.+)/;
    const authority = base[4].trim().match(authorityPattern);

    // authority[2] is guaranteed by the previous regexp.
    const endpoints = parseAddressList(authority[2]);

    let userinfo = authority[1] || '';
    // Remove the trailing `@`.
    userinfo = userinfo.slice(0, userinfo.length - 1);

    const username = userinfo.split(':')[0];
    const password = userinfo.split(':')[1];

    const query = base[6];

    const security = !query ? {} : qs.parse(query.substring(1, query.length));
    const isSecure = ['ssl-enable', 'ssl-ca', 'ssl-crl'].filter(p => security[p] !== undefined).length > 0;

    const values = {
        dbUser: username,
        dbPassword: password,
        endpoints,
        // Schema name should not include the leading '/'.
        schema: (base[5] || '').match(/^\/?([^)]*)\/?$/)[1],
        // ssl should be true if the query contains any `ssl-*` option.
        ssl: isSecure
    };

    const securityOptions = Object.assign({}, security);
    delete securityOptions['ssl-enable'];

    values.sslOptions = Object.keys(securityOptions).reduce((sslOptions, option) => {
        const value = (securityOptions[option] || '').match(/^\(?([^)]*)\)?$/)[1] || '';
        const key = option.substring(option.indexOf('-') + 1, option.length);

        return Object.assign({ [key]: value }, sslOptions);
    }, undefined);

    // Drop all falsy values.
    return Object.keys(values).reduce((result, key) => {
        const next = Object.assign({}, result);

        if (!result[key]) {
            delete next[key];
        }

        return next;
    }, values);
};

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
function parseAddressList (input) {
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

    return [parseAddress(input)];
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
        .map(tuple => {
            const result = { host: tuple.host };

            if (!tuple.port) {
                return result;
            }

            return Object.assign(result, { port: tuple.port });
        });
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

    if (!singles || singles.length < 2) {
        return [];
    }

    return singles.map(parseAddress);
}

/**
 * Parse a single address with an explicit priority.
 * @private
 * @param {string} input - formatted address tuple string
 * @throws {Error} When explicit priorities are not provided for all failover addresses.
 * @throws {Error} When failover address priorities are out of bounds.
 * @returns {Address} Object containing the address details.
 * @example
 * const ipv6Address = '([::1]:33060, 100)'
 * const ipv4Address = '(127.0.0.1:33060, 98)'
 * const cnAddress = '(localhost:33060, 99)'
 */
function parsePriorityAddress (input) {
    const addressMatch = input.trim().match(/^\(([^,]+), ?priority=([\d-]+)\)$/);

    if (!addressMatch || !addressMatch[1]) {
        const error = new Error('You must either assign no priority to any of the routers or give a priority for every router');
        error.errno = 4000;

        throw error;
    }

    const address = parseAddress(addressMatch[1]);
    const priority = parseInt(addressMatch[2], 10);

    if (isNaN(priority) || priority < 0 || priority > 100) {
        const error = new Error('The priorities must be between 0 and 100');
        error.errno = 4007;

        throw error;
    }

    return Object.assign(address, { priority });
}

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
function parseAddress (input) {
    // hostMatch will always contain something
    const hostMatch = input.trim().match(/\[(.+)\]|([^:]+)/);
    const portMatch = input.trim().match(/:([^[\]]+)$/) || [];

    // hostMatch[1] contains an IPv6 address match
    // hostMatch[2] contains a non-IPv6 address match
    const host = hostMatch[1] || hostMatch[2];

    assert(host && (isIPv6(host) || isIPv4(host) || isCommonName(host)), 'Invalid URI');

    const address = { host };

    if (portMatch[1]) {
        const portNum = parseInt(portMatch[1], 10);

        address.port = !isNaN(portNum) ? portNum : portMatch[1];
    }

    return address;
}

/**
 * Check if a host is a valid IPv6 address.
 * @param {string} input - host
 * @returns {Boolean}
 */
function isIPv6 (input) {
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
 * @param {string} input - host
 * @returns {Boolean}
 */
function isIPv4 (input) {
    const decOctet = '([0-9]|[1-9][0-9]|1[0-9]{0,2}|2[0-4][0-9]|25[0-5])';
    const ipv4Address = `^(${decOctet}\\.){3}${decOctet}$`;

    return (new RegExp(ipv4Address)).test(input);
}

/**
 * Check if a host is a valid common name (RFC 3896 `reg-name`).
 * @param {string} input - host
 * @returns {Boolean}
 */
function isCommonName (input) {
    const commonName = '^[a-zA-Z0-9-._~%!$&\'()*+,;=]+$';

    return (new RegExp(commonName)).test(input);
}

module.exports = parseUri;
