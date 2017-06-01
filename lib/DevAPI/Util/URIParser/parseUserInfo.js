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

module.exports = parse;

/**
 * User credentials.
 * @private
 * @typedef {Object} UserInfo
 * @prop {string} username
 * @prop {string} [password]
 */

/**
 * Parse the user authentication details.
 * @private
 * @param {string} input - authentication segment
 * @throws {Error} When the segment is not valid.
 * @returns {UserInfo} Object containing the user credentials.
 */
function parse (input) {
    // TODO(Rui): use default agument values on node >= 6.0.0
    const match = (input || '').trim().match(/^([^:@]+)(:([^@]*))?/) || [];

    const validationPattern = /^[a-zA-Z0-9-._~%!$&'()*+,;=]*$/;
    const isValidUsername = validationPattern.test(match[1]);
    const isValidPassword = validationPattern.test(match[3]);

    if (!isValidUsername || !isValidPassword) {
        throw new Error('Invalid userinfo segment');
    }

    return {
        username: !match[1] ? match[1] : decodeURIComponent(match[1]),
        password: !match[3] ? match[3] : decodeURIComponent(match[3])
    };
}
