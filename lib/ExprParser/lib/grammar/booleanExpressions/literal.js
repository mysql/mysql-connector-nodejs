/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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

const PARSER_OPTIONS = {
    ID: 'literal',
    NAME: 'LITERAL'
};

const parseIntegerType = value => {
    // Can be converted to a number if it is safe.
    return Number.isSafeInteger(parseInt(value, 10)) ? parseInt(value, 10) : value;
};

const parseFloatType = value => {
    // If "parseFloat()"" yields less digits, it means it is unsafe.
    return parseFloat(value).toString().length !== value.length ? value : parseFloat(value);
};

/**
 * Concrete sub-parser that matches literals.
 * It is concrete because it is able to parse a valid expression on its own.
 * literal  ::= INT
 *          | FLOAT
 *          | STRING_SQ
 *          | STRING_DQ
 *          | 'NULL'
 *          | 'FALSE'
 *          | 'TRUE'
 * @private
 * @param {Object} [_] - Optional object containing parser options.
 * @returns The generated grammar for the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html#expression-ebnf-literal
 * @example
 * 1
 * 1.234
 * 'foo'
 * "foo"
 * NULL, null
 * FALSE, false
 * TRUE, true
 */
const parser = _ => r => Pa
    // A literal should be represented by a corresponding JavaScript type.
    .alt(
        r.FLOAT.map(parseFloatType),
        r.INT.map(parseIntegerType),
        r.STRING_DQ,
        r.STRING_SQ,
        r.NULL,
        r.FALSE,
        r.TRUE
    )
    // parser returns { type, value }
    .map(literal => ({ type: PARSER_OPTIONS.ID, value: literal }));

module.exports = { name: PARSER_OPTIONS.NAME, parser };
