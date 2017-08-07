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

const parseAddressList = require('./parseAddressList');
const parseAuthenticationMechanism = require('./parseAuthenticationMechanism');
const parseSchema = require('./parseSchema');
const parseSecurityOptions = require('./parseSecurityOptions');
const parseUserInfo = require('./parseUserInfo');

/**
 * URI parser.
 * @private
 * @module lib/DevAPI/URIParser
 */

module.exports = parse;

/**
 * Parse a mysqlx-specific connection URI.
 * @private
 * @param {string} input - connection URI
 * @throws {Error} When the URI is not valid.
 * @returns {URI} Object containing the connection properties.
 */
function parse (input) {
    const base = input.trim().match(/^(([^+:]+)\+?([^:]+)?:\/\/)?([^?]+)(\?.*)?$/) || [];

    // Bare-minimum requirements: host
    if (!base[4]) {
        throw new Error('Invalid URI');
    }

    const authoritySegmentPattern = /^([^@]+@)?(.+)/;
    const authoritySegment = base[4].trim().match(authoritySegmentPattern);

    const userinfo = parseUserInfo(authoritySegment[1]);
    const ssl = parseSecurityOptions(base[5]);

    const targetSegmentPattern = /^\(([^)]+)\)(\/.+)?|([^/]+)(\/(.+))?/;
    const targetSegment = authoritySegment[2].trim().match(targetSegmentPattern);

    // `addressSegment` is guaranteed by previous regular expressions.
    const addressSegment = targetSegment[1] || targetSegment[3];
    const schemaSegment = targetSegment[2] || targetSegment[4];

    return {
        auth: parseAuthenticationMechanism(base[5]),
        dbUser: userinfo.username,
        dbPassword: userinfo.password,
        endpoints: parseAddressList(addressSegment),
        schema: parseSchema(schemaSegment),
        ssl: ssl.enable,
        sslOptions: { ca: ssl.ca, crl: ssl.crl }
    };
}
