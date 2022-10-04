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

const PARSER_NAME = 'PROJECTED_SEARCH_EXPR';

/**
 * Abstract sub-parser that matches a projected search expression.
 * It is abstract because it relies on the underlying sub-parsers to determine
 * how to parse the expression.
 * ProjectedSearchExprStrList ::= '[' '"' expr ( 'AS' literal )? '"' ( ',' '"' expr ( 'AS' literal )? '"' )* ']'
 * @private
 * @param {Object} [_] - Optional object containing parser options.
 * @returns The generated grammar for the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-projectedsearchexprstrlist
 * @example
 * count(foo) as count
 */
const parser = () => r => Pa
    .seq(r.expr, r.AS.trim(Pa.whitespace).then(r.ident).atMost(1).map(([alias]) => alias))
    .map(([source, alias]) => ({ source, alias }));

module.exports = { name: PARSER_NAME, parser };
