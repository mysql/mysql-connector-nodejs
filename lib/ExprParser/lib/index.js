/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
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

const booleanExpressions = require('./grammar/booleanExpressions');
const collectionOrTableExpressions = require('./grammar/collectionOrTableExpressions');
const keywords = require('./grammar/keywords');
const partials = require('./grammar/partials');
const projectedSearchExpr = require('./grammar/projectedSearchExpr');
const sortExpr = require('./grammar/sortExpr');

/**
 * Available parser modes.
 * @readonly
 * @private
 * @name DataModel
 * @enum {number}
 */
const DataModel = parser.Mode = require('./stubs/mysqlx_crud_pb').DataModel;

/**
 * Available parser types.
 * @readonly
 * @private
 * @name Type
 * @enum {number}
 */
const Type = parser.Type = Object.assign({}, booleanExpressions.Type, collectionOrTableExpressions.Type, {
    [sortExpr.name]: 'sortExpr',
    [projectedSearchExpr.name]: 'projectedSearchExpr'
});

function parser (options) {
    options = Object.assign({}, {
        type: Type.EXPR,
        mode: DataModel.DOCUMENT,
        placeholders: [],
        scoped: false
    }, options);

    const parsers = Object.assign({}, keywords(options), partials(options), booleanExpressions(options), collectionOrTableExpressions(options), {

        QUOTED_ID (r) {
            return Pa.seq(
                Pa.string('`'),
                Pa.alt(Pa.string('``').result('`'), Pa.noneOf('`')).many().tie(),
                Pa.string('`')
            ).tie();
        },

        ID (r) {
            return Pa.seq(
                Pa.alt(
                    Pa.string('_'),
                    Pa.letter
                ),
                Pa.alt(
                    Pa.string('_'),
                    Pa.letter,
                    r.DIGIT
                ).many().tie()
            ).tie();
        },

        INTERVAL_UNIT () {
            return Pa.alt(
                Pa.string('MICROSECOND'),
                Pa.string('SECOND_MICROSECOND'),
                Pa.string('SECOND'),
                Pa.string('MINUTE_MICROSECOND'),
                Pa.string('MINUTE_SECOND'),
                Pa.string('MINUTE'),
                Pa.string('HOUR_MICROSECOND'),
                Pa.string('HOUR_SECOND'),
                Pa.string('HOUR_MINUTE'),
                Pa.string('HOUR'),
                Pa.string('DAY_MICROSECOND'),
                Pa.string('DAY_SECOND'),
                Pa.string('DAY_MINUTE'),
                Pa.string('DAY_HOUR'),
                Pa.string('DAY'),
                Pa.string('WEEK'),
                Pa.string('MONTH'),
                Pa.string('QUARTER'),
                Pa.string('YEAR_MONTH'),
                Pa.string('YEAR')
            );
        },

        STRING_DQ (r) {
            return Pa
                .seq(
                    Pa.string('"'),
                    Pa.alt(r.SCHAR, Pa.string("'"), r.ESCAPED_DQ, r.ESCAPED_ESCAPE_CHAR).many().tie(),
                    Pa.string('"')
                )
                .tie();
        },

        ESCAPED_DQ (r) {
            return Pa.alt(Pa.string('""'), Pa.string('\u005C"')).map(() => '"');
        },

        ESCAPED_ESCAPE_CHAR (r) {
            return Pa.string('\u005C\u005C').map(() => '\u005C');
        },

        STRING_SQ (r) {
            return Pa
                .seq(
                    Pa.string("'"),
                    Pa.alt(r.SCHAR, Pa.string('"'), r.ESCAPED_SQ, r.ESCAPED_ESCAPE_CHAR).many().tie(),
                    Pa.string("'")
                )
                .tie();
        },

        ESCAPED_SQ (r) {
            return Pa.alt(Pa.string("''"), Pa.string("\u005C'")).map(() => "'");
        },

        DIGIT () {
            return Pa.digit;
        },

        FLOAT (r) {
            return Pa
                .seq(
                    Pa.string('-').atMost(1).tie(),
                    Pa
                        .alt(
                            Pa.seq(
                                r.DIGIT.many().tie(),
                                Pa.string('.'),
                                r.DIGIT.atLeast(1).tie(),
                                Pa.seq(
                                    Pa.string('E'),
                                    Pa.alt(Pa.string('+'), Pa.string('-')).atMost(1),
                                    r.DIGIT.atLeast(1).tie()
                                ).atMost(1).tie()
                            ),
                            Pa.seq(
                                r.DIGIT.atLeast(1).tie(),
                                Pa.string('E'),
                                Pa.alt(Pa.string('+'), Pa.string('-')).atMost(1),
                                r.DIGIT.atLeast(1).tie()
                            )
                        )
                        .tie()
                )
                .tie();
        },

        INT (r) {
            return Pa
                .seq(
                    Pa.string('-').atMost(1).tie(),
                    r.DIGIT.atLeast(1).tie()
                )
                .tie();
        },

        SCHAR () {
            return Pa.alt(
                Pa.range('\u0020', '\u0021'),
                // excludes double quotes (quotation mark)
                Pa.range('\u0023', '\u0026'),
                // excludes single quotes (apostrophe)
                Pa.range('\u0028', '\u005B'),
                // excludes escape character (reverse solidus)
                Pa.range('\u005D', '\u007E'),
                Pa.range('\u0080', '\uFFFF')
            );
        },

        // Additional Expression Types
        projectedSearchExpr: projectedSearchExpr.parser(options),
        sortExpr: sortExpr.parser(options),

        // Shortcuts

        blank (r) {
            return Pa.whitespace;
        },

        optBlank (r) {
            return r.blank.atMost(1);
        },

        optNotPrefix (r) {
            return r.NOT.skip(r.blank).atMost(1).map(data => !data.length ? '' : 'not_');
        },

        optNotSuffix (r) {
            return r.NOT.skip(r.blank).atMost(1).map(data => !data.length ? '' : '_not');
        }
    });

    const language = Pa.createLanguage(parsers);

    return language[options.type];
}

module.exports = parser;
