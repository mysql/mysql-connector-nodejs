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

const qs = require('querystring');

/**
 * @module stringifyUri
 * @private
 */

/**
 * Stringify an object containting URI parameters.
 * @private
 * @param {Object} input - URI parameters
 * @returns {string} The URI string.
 */
function stringifyUri (input) {
    input = Object.assign({ endpoints: [{ host: input.host, port: input.port, socket: input.socket }] }, input);

    return 'mysqlx://'
        .concat(stringifyUserInfo(input))
        .concat(stringifyAuthority(input))
        .concat(stringifySchema(input))
        .concat(stringifySecurityOptions(input));
};

/**
 * Stringify the authority/address segment of a URI.
 * @private
 * @param {Object} input - URI parameters
 * @throws {Error} When no host or socket are specified.
 * @returns {string} The authority segment string.
 */
function stringifyAuthority (input) {
    const host = input.endpoints[0].host;
    const port = input.endpoints[0].port;
    const socket = input.endpoints[0].socket;

    if (!host && !socket) {
        throw new Error('Either a host or socket must be provided');
    }

    if (socket) {
        return `(${socket})`;
    }

    if (port) {
        return `${host}:${port}`;
    }

    return `${host}`;
}

/**
 * Stringify the authentication (username and password) segment of a URI.
 * @private
 * @param {Object} input - URI parameters
 * @returns {string} The authentication segment string.
 */
function stringifyUserInfo (input) {
    if (!input.dbUser && !input.dbPassword) {
        return '';
    }

    if (typeof input.dbPassword === 'undefined') {
        return `${input.dbUser}@`;
    }

    return `${input.dbUser}:${input.dbPassword}@`;
}

/**
 * Stringify the schema segment of a URI.
 * @private
 * @param {Object} input - URI parameters
 * @returns {string} The schema segment string.
 */
function stringifySchema (input) {
    if (!input.schema) {
        return '';
    }

    return `/${input.schema}`;
}

/**
 * Stringify the security options of a URI.
 * @private
 * @param {Object} input
 * @returns {string} The URI security segement string.
 */
function stringifySecurityOptions (input) {
    if (input.ssl === false) {
        return `?ssl-mode=DISABLED`;
    }

    const options = Object.keys(input.sslOptions || {}).reduce((result, key) => {
        if (!input.sslOptions[key]) {
            return result;
        }

        return Object.assign(result, { [`ssl-${key}`]: `(${input.sslOptions[key]})` });
    }, {});

    if (!Object.keys(options).length) {
        return '';
    }

    return `?ssl-mode=VERIFY_CA&${qs.stringify(options)}`;
}

module.exports = stringifyUri;
