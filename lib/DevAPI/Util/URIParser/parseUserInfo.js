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
