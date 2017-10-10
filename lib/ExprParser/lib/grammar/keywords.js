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

const Pa = require('parsimmon');

const ignoreCase = str => Pa((input, i) => {
    const j = i + str.length;
    const head = input.slice(i, j);

    if (head.toLowerCase() === str.toLowerCase()) {
        return Pa.makeSuccess(j, head);
    }

    return Pa.makeFailure(i, `expecting either "${str.toLowerCase()}" or "${str.toUpperCase()}"`);
});

module.exports = options => ({
    AND () {
        return Pa.alt(Pa.string('&&'), ignoreCase('AND')).map(() => '&&');
    },

    AS () {
        return ignoreCase('AS');
    },

    ASC () {
        return ignoreCase('ASC').map(() => 1);
    },

    BETWEEN () {
        return ignoreCase('BETWEEN');
    },

    BINARY () {
        return ignoreCase('BINARY').map(() => 'BINARY');
    },

    CAST () {
        return ignoreCase('CAST').map(() => 'cast');
    },

    CHAR () {
        return ignoreCase('CHAR').map(() => 'CHAR');
    },

    DATE () {
        return ignoreCase('DATE').map(() => 'DATE');
    },

    DATETIME () {
        return ignoreCase('DATETIME').map(() => 'DATETIME');
    },

    DECIMAL () {
        return ignoreCase('DECIMAL').map(() => 'DECIMAL');
    },

    DESC () {
        return ignoreCase('DESC').map(() => 2);
    },

    ESCAPE () {
        return ignoreCase('ESCAPE');
    },

    FALSE () {
        return ignoreCase('FALSE').map(() => false);
    },

    IN () {
        return ignoreCase('IN').map(() => 'in');
    },

    INTEGER () {
        return ignoreCase('INTEGER').map(() => 'INTEGER');
    },

    INTERVAL () {
        return ignoreCase('INTERVAL');
    },

    IS () {
        return ignoreCase('IS').map(() => 'is');
    },

    JSON () {
        return ignoreCase('JSON').map(() => 'JSON');
    },

    LIKE () {
        return ignoreCase('LIKE').map(() => 'like');
    },

    NOT () {
        return ignoreCase('NOT');
    },

    NULL () {
        return ignoreCase('NULL').map(() => null);
    },

    OR () {
        return Pa.alt(Pa.string('||'), ignoreCase('OR')).map(() => '||');
    },

    REGEXP () {
        return ignoreCase('REGEXP');
    },

    SIGNED () {
        return ignoreCase('SIGNED').map(() => 'SIGNED');
    },

    TIME () {
        return ignoreCase('TIME').map(() => 'TIME');
    },

    TRUE () {
        return ignoreCase('TRUE').map(() => true);
    },

    UNSIGNED () {
        return ignoreCase('UNSIGNED').map(() => 'UNSIGNED');
    }
});
