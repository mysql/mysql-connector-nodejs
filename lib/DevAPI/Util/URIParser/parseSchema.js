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
        throw new Error('Invalid schema name');
    }

    return match[1];
}
