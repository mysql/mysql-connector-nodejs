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

const binaryOperatorMapper = require('../../mappers/binaryOperator');
const Pa = require('parsimmon');

const PARSER_OPTIONS = {
    ID: 'bitExpr',
    NAME: 'BIT_EXPR'
};

/**
 * Concrete sub-parser that matches a bitwise operator expression.
 * It is concrete because it is able to parse a valid expression on its own.
 * bitExpr ::= shiftExpr ( ( '&' | '|' | '^' ) shiftExpr )*
 * @private
 * @param {Object} [_] - Optional object containing parser options.
 * @returns The generated grammar for the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html#expression-ebnf-bitexpr
 * @example
 * 1 & 1
 * 1 | 0
 * 0 ^ 1
 */
const parser = _ => r => Pa
    .seq(r.xorBitExprPart, Pa.seq(Pa.string('|').trim(Pa.optWhitespace), r.xorBitExprPart).map(([name, param]) => ({ name, params: [param] })).many())
    .map(([one, more]) => !more.length ? one : binaryOperatorMapper({ type: PARSER_OPTIONS.ID, one, more }));

module.exports = { name: PARSER_OPTIONS.NAME, parser };
