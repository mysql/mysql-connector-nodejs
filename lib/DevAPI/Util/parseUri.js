/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

module.exports = function (uri) {
    const match = uri.match(/^(mysqlx:\/\/)?(([^:@]*):?([^@]*)@)?(\[([^\]]*)]|[^:/?]*):?(\d+)?([^?]+)?(\?[^#]+)?(#.+)?$/i);

    // Bare-minimum requirements: host
    assert(match && match[5], 'Invalid URI');

    const values = {
        dbUser: match[3],
        dbPassword: match[4],
        // IPv6 address should be a subgroup in the regexp (only available for IPv6 hosts).
        host: match[6] || match[5],
        // Port should be a number.
        port: parseInt(match[7], 10),
        // Schema name should not include the leading '/'.
        schema: !match[8] ? match[8] : match[8].substring(1, match[8].length),
        // ssl should be true if the query contains 'ssl-enable'
        ssl: !match[9] ? match[9] : qs.parse(match[9].substring(1, match[9].length))['ssl-enable'] !== undefined
    };

    // Drop all falsy values.
    return Object.keys(values).reduce((result, key) => {
        const next = Object.assign({}, result);

        if (!result[key]) {
            delete next[key];
        }

        return next;
    }, values);
};
