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
    ID: 'columnIdent',
    NAME: 'COLUMN_IDENT'
};

const jsonFunction = Pa.alt(
    Pa.string('->>').result('json_unquote'),
    Pa.string('->').result('json_extract')
);

/**
 * Concrete sub-parser that matches a column identifier in table mode.
 * It is concrete because it is able to parse a valid expression on its own.
 * Beside a regular column identifier, the parser needs to account for the
 * usage of "JSON_UNQUOTE()", which turns the result into a function call.
 * columnIdent ::= ( ident '.' ( ident '.' )? )? ident ( ( '->' | '->>' ) "'" '$' documentPath "'" )?
 * @private
 * @param {Object} [_] - Optional object containing parser options.
 * @returns The generated grammar for the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html#expression-ebnf-columnident
 * @example
 * foo
 * foo.bar
 * foo.bar.baz
 * foo.bar.baz->'$.qux'
 * foo.bar.baz->>'$.qux'
 * foo.bar.baz->'$.qux.quux'
 * foo.bar.baz->>'$.qux.quux'
 */
const parser = _ => r => Pa
    .seq(
        r.ident.sepBy1(Pa.string('.')).map(([one, two, three]) => {
            if (typeof three !== 'undefined') {
                return { name: three, schema: one, table: two };
            }

            if (typeof two !== 'undefined') {
                return { name: two, table: one };
            }

            return { name: one };
        }),
        Pa.seq(jsonFunction, Pa.string('$').then(r.documentPath).wrap(Pa.string("'"), Pa.string("'")))
            .atMost(1)
            // We are only interested in the one possible instance.
            .map(matches => !matches.length ? matches : matches[0])
    )
    .map(([identifier, remainder]) => {
        const columnIdent = { type: PARSER_OPTIONS.ID };
        // If only the identifier is available, it means the expression is a
        // column identifier without a document path.
        if (!remainder.length) {
            return { ...columnIdent, value: { documentPath: [], ...identifier } };
        }

        const [name, documentPath] = remainder;

        // If the column identifier uses the JSON_EXTRACT shortcut, the
        // expression can be encoded as a regular column identifier.
        if (name === 'json_extract') {
            return { ...columnIdent, value: { documentPath, ...identifier } };
        }

        // If the column identifier uses the JSON_UNQUOTE shortcut, the
        // expression has to be encoded as a functionCall instead,
        // containining the column identifier as a parameter.
        return { type: 'functionCall', value: { name: { name }, params: [{ ...columnIdent, value: { documentPath, ...identifier } }] } };
    });

module.exports = { name: PARSER_OPTIONS.NAME, parser };
