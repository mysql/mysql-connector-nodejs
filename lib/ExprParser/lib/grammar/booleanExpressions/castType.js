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

const Expr = require('../../stubs/mysqlx_expr_pb').Expr;
const Scalar = require('../../stubs/mysqlx_datatypes_pb').Scalar;
const Pa = require('parsimmon');

const parser = options => r => Pa
    .alt(
        Pa
            .seq(
                r.SIGNED,
                Pa
                    .seq(
                        Pa.whitespace,
                        r.INTEGER
                    )
                    .tie()
                    .atMost(1)
                    .map(data => !data.length ? '' : data[0])
            )
            .tie(),
        Pa
            .seq(
                r.UNSIGNED,
                Pa
                    .seq(
                        Pa.whitespace,
                        r.INTEGER
                    )
                    .tie()
                    .atMost(1)
                    .map(data => !data.length ? '' : data[0])
            )
            .tie(),
        Pa
            .seq(
                r.CHAR,
                r.lengthSpec.atMost(1).map(data => !data.length ? '' : data[0])
            )
            .tie(),
        Pa
            .seq(
                r.BINARY,
                r.lengthSpec.atMost(1).map(data => !data.length ? '' : data[0])
            )
            .tie(),
        Pa
            .seq(
                r.DECIMAL,
                Pa
                    .alt(
                        r.lengthSpec,
                        Pa
                            .seq(
                                Pa.string('('),
                                Pa.optWhitespace,
                                r.INT,
                                Pa.optWhitespace,
                                Pa.string(','),
                                Pa.optWhitespace,
                                r.INT,
                                Pa.optWhitespace,
                                Pa.string(')')
                            )
                            .tie()
                    )
                    .atMost(1)
                    .map(data => !data.length ? '' : data[0])
            )
            .tie(),
        r.TIME,
        r.DATETIME,
        r.DATE,
        r.JSON
    )
    .map(data => {
        const bin = new Scalar.Octets();
        /* eslint-disable node/no-deprecated-api */
        bin.setValue(new Uint8Array(new Buffer(data)));
        /* eslint-enable node/no-deprecated-api */

        const scalar = new Scalar();
        scalar.setType(Scalar.Type.V_OCTETS);
        scalar.setVOctets(bin);

        const expr = new Expr();
        expr.setType(Expr.Type.LITERAL);
        expr.setLiteral(scalar);

        return expr;
    });

module.exports = { name: 'CAST_TYPE', parser };
