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

const Pa = require('parsimmon');

const ignoreCase = str => Pa((input, i) => {
    const j = i + str.length;
    const head = input.slice(i, j);

    if (head.toLowerCase() === str.toLowerCase()) {
        return Pa.makeSuccess(j, head);
    }

    // wrap the expected value in single-quotes to fit the underlying Parsimmon exception format
    return Pa.makeFailure(i, `'${str.toLowerCase()}'`);
});

module.exports = options => ({
    AND () {
        return Pa.alt(Pa.string('&&'), ignoreCase('AND')).result('&&');
    },

    AS () {
        return ignoreCase('AS');
    },

    ASC () {
        return ignoreCase('ASC').result(1);
    },

    BETWEEN () {
        return ignoreCase('BETWEEN').result('between');
    },

    BINARY () {
        return ignoreCase('BINARY').result('BINARY');
    },

    CAST () {
        return ignoreCase('CAST').result('cast');
    },

    CHAR () {
        return ignoreCase('CHAR').result('CHAR');
    },

    DATE () {
        return ignoreCase('DATE').result('DATE');
    },

    DATETIME () {
        return ignoreCase('DATETIME').result('DATETIME');
    },

    DECIMAL () {
        return ignoreCase('DECIMAL').result('DECIMAL');
    },

    DESC () {
        return ignoreCase('DESC').result(2);
    },

    DIV () {
        return ignoreCase('DIV').result('div');
    },

    ESCAPE () {
        return ignoreCase('ESCAPE').result('escape');
    },

    FALSE () {
        return ignoreCase('FALSE').result(false);
    },

    IN () {
        return ignoreCase('IN').result('in');
    },

    INTEGER () {
        return ignoreCase('INTEGER').result('INTEGER');
    },

    INTERVAL () {
        return ignoreCase('INTERVAL');
    },

    IS () {
        return ignoreCase('IS').result('is');
    },

    JSON () {
        return ignoreCase('JSON').result('JSON');
    },

    LIKE () {
        return ignoreCase('LIKE').result('like');
    },

    NOT () {
        return ignoreCase('NOT').result('not');
    },

    NULL () {
        return ignoreCase('NULL').result(null);
    },

    OR () {
        return Pa.alt(Pa.string('||'), ignoreCase('OR')).result('||');
    },

    OVERLAPS () {
        return ignoreCase('OVERLAPS').result('overlaps');
    },

    REGEXP () {
        return ignoreCase('REGEXP').result('regexp');
    },

    SIGNED () {
        return ignoreCase('SIGNED').result('SIGNED');
    },

    TIME () {
        return ignoreCase('TIME').result('TIME');
    },

    TRUE () {
        return ignoreCase('TRUE').result(true);
    },

    UNSIGNED () {
        return ignoreCase('UNSIGNED').result('UNSIGNED');
    }
});
