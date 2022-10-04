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
    ID: 'castType',
    NAME: 'CAST_TYPE'
};

/**
 * Concrete sub-parser that matches the type specification for a cast function.
 * It is concrete because it is able to parse a valid expression on its own.
 * Although it is not highly valuable, the outcome is similiar to a literal.
 * However, it uses a specific type because the type is a keyword and not an
 * effective literal, which is encoded as an opaque value.
 * castType ::= 'SIGNED' 'INTEGER'*
 *          | 'UNSIGNED' 'INTEGER'*
 *          | 'CHAR' lengthSpec*
 *          | 'BINARY' lengthSpec*
 *          | 'DECIMAL' ( lengthSpec | '(' INT ',' INT ')' )?
 *          | 'TIME'
 *          | 'DATE'
 *          | 'DATETIME'
 *          | 'JSON'
 * @private
 * @param {Object} [_] - Optional object containing parser options.
 * @returns The generated grammar for the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html#expression-ebnf-casttype
 * @example
 * SIGNED INTEGER
 * CHAR(3)
 * BINARY(5)
 * DECIMAL(3, 2)
 * JSON
 */
const parser = _ => r => Pa.alt(
    r.SIGNED.skip(Pa.seq(Pa.whitespace, r.INTEGER).atMost(1)), // "SIGNED" should suffice
    r.UNSIGNED.skip(Pa.seq(Pa.whitespace, r.INTEGER).atMost(1)), // "UNSIGNED" should suffice
    // "lengthSpec" is a public expression parser definition and it uses the
    // standard "{ type, value }" structure. However, the length by itself
    // does not have any meaning, so we need to tie it back to the data type.
    Pa.seq(r.CHAR, r.lengthSpec.atMost(1).tie()).tie(), // "CHAR" or "CHAR(n)"
    Pa.seq(r.BINARY, r.lengthSpec.atMost(1).tie()).tie(), // "BINARY" or "BINARY(n)"
    Pa.seq(r.DECIMAL, r.decimalSpecPart.atMost(1).tie()).tie(), // "DECIMAL" or "DECIMAL(x, y)""
    r.TIME,
    r.DATETIME,
    r.DATE,
    r.JSON
).map(value => ({ type: PARSER_OPTIONS.ID, value: value }));

module.exports = { name: PARSER_OPTIONS.NAME, parser };
