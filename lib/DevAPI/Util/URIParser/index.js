/*
 * Copyright (c) 2017, 2020, Oracle and/or its affiliates. All rights reserved.
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

const parseAddressList = require('./parseAddressList');
const parseAuthenticationMechanism = require('./parseAuthenticationMechanism');
const parseConnectTimeout = require('./parseConnectTimeout');
const parseSchema = require('./parseSchema');
const parseSecurityOptions = require('./parseSecurityOptions');
const parseUserInfo = require('./parseUserInfo');
const parseConnectionAttributes = require('./parseConnectionAttributes');

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

    const scheme = base[2];
    const extension = base[3];

    if (typeof extension !== 'undefined' && extension !== 'srv') {
        throw new Error(`Scheme ${scheme}+${extension} is not valid.`);
    }

    const authoritySegmentPattern = /^([^@]+@)?(.+)/;
    const authoritySegment = base[4].trim().match(authoritySegmentPattern);

    const userinfo = parseUserInfo(authoritySegment[1]);
    const tls = parseSecurityOptions(base[5]);

    const targetSegmentPattern = /^\(([^)]+)\)(\/.+)?|([^/]+)(\/(.+))?/;
    const targetSegment = authoritySegment[2].trim().match(targetSegmentPattern);

    // `addressSegment` is guaranteed by previous regular expressions.
    const addressSegment = targetSegment[1] || targetSegment[3];
    const schemaSegment = targetSegment[2] || targetSegment[4];

    return {
        auth: parseAuthenticationMechanism(base[5]),
        connectTimeout: parseConnectTimeout(base[5]),
        connectionAttributes: parseConnectionAttributes(base[5]),
        dbUser: userinfo.username,
        dbPassword: userinfo.password,
        endpoints: parseAddressList(addressSegment),
        resolveSrv: extension === 'srv',
        schema: parseSchema(schemaSegment),
        tls
    };
}
