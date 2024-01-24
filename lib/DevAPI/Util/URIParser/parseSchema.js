/*
 * Copyright (c) 2017, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const errors = require('../../../constants/errors');

module.exports = parse;

/**
 * Parse the database schema name (URI path).
 * @private
 * @param {string} input - path
 * @throws {Error} When the schema name is not valid.
 * @returns {string} Schema name.
 */
function parse (input) {
    // TODO(Rui): use default agument values on node >= 6.0.0
    const match = ((input || '').trim().match(/^\/([^?]+)$/) || []);

    const validationPattern = /^[a-zA-Z0-9-._~%!$&'()*+,;=:@]*$/;
    const isValidPath = validationPattern.test(match[1]);

    if (!isValidPath) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME);
    }

    return match[1] && decodeURIComponent(match[1]);
}
