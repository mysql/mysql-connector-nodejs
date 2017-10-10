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

const Expr = require('../../stubs/mysqlx_expr_pb').Expr;
const Operator = require('../../stubs/mysqlx_expr_pb').Operator;
const Scalar = require('../../stubs/mysqlx_datatypes_pb').Scalar;
const Pa = require('parsimmon');

const parser = options => r => Pa
    .alt(
        Pa
            .seq(
                r.compExpr,
                Pa.whitespace,
                r.IS,
                Pa.seq(Pa.whitespace, r.NOT).atMost(1),
                Pa.whitespace,
                Pa.alt(r.NULL, r.TRUE, r.FALSE)
            )
            .map(data => {
                const operator = new Operator();

                if (!data[3].length) {
                    operator.setName('is');
                } else {
                    operator.setName('is_not');
                }

                operator.addParam(data[0]);

                const scalar = new Scalar();

                if (data[5] !== null) {
                    scalar.setType(Scalar.Type.V_BOOL);
                    scalar.setVBool(data[5]);
                } else {
                    scalar.setType(Scalar.Type.V_NULL);
                }

                // literal to represent `null|true|false`
                const literal = new Expr();
                literal.setType(Expr.Type.LITERAL);
                literal.setLiteral(scalar);

                operator.addParam(literal);

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);
                expr.setOperator(operator);

                return expr;
            }),
        Pa
            .seq(
                r.compExpr,
                Pa.seq(Pa.whitespace, r.NOT).atMost(1),
                Pa.whitespace,
                r.IN,
                Pa.whitespace,
                Pa.string('('),
                Pa
                    .seq(Pa.optWhitespace, r.argsList, Pa.optWhitespace)
                    .atMost(1)
                    .map(data => data[0].length ? data[0][1] : []),
                Pa.string(')')
            )
            .map(data => {
                const operator = new Operator();
                operator.addParam(data[0]);

                if (!data[1].length) {
                    operator.setName('in');
                } else {
                    operator.setName('not_in');
                }

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);

                data[6].forEach(additional => {
                    operator.addParam(additional);
                });

                expr.setOperator(operator);

                return expr;
            }),
        Pa
            .seq(
                r.compExpr,
                Pa.seq(Pa.whitespace, r.NOT).atMost(1),
                Pa.whitespace,
                r.IN,
                Pa.whitespace,
                r.compExpr
            )
            .map(data => {
                const operator = new Operator();
                operator.addParam(data[0]);
                operator.addParam(data[5]);

                if (!data[1].length) {
                    operator.setName('cont_in');
                } else {
                    operator.setName('not_cont_in');
                }

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);
                expr.setOperator(operator);

                return expr;
            }),
        Pa
            .seq(
                r.compExpr,
                Pa
                    .seq(Pa.whitespace, r.NOT)
                    .atMost(1)
                    .map(data => data[0]),
                Pa.whitespace,
                r.LIKE,
                Pa.whitespace,
                r.compExpr,
                Pa
                    .seq(Pa.whitespace, r.ESCAPE, Pa.whitespace, r.compExpr)
                    .atMost(1)
                    .map(data => data[0])
            )
            .map(data => {
                const operator = new Operator();
                operator.addParam(data[0]);
                operator.addParam(data[5]);

                if (!data[1]) {
                    operator.setName('like');
                } else {
                    operator.setName('not_like');
                }

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);

                if (!data[6]) {
                    expr.setOperator(operator);

                    return expr;
                }

                const subOperator = new Operator();
                subOperator.setName('escape');
                subOperator.addParam(data[6][3]);

                const subExpr = new Expr();
                subExpr.setType(Expr.Type.OPERATOR);
                subExpr.setOperator(subOperator);

                operator.addParam(subExpr);

                expr.setOperator(operator);

                return expr;
            }),
        Pa
            .seq(
                r.compExpr,
                Pa.seq(Pa.whitespace, r.NOT).atMost(1),
                Pa.whitespace,
                r.BETWEEN,
                Pa.whitespace,
                r.compExpr,
                Pa.whitespace,
                r.AND,
                Pa.whitespace,
                r.compExpr
            )
            .map(data => {
                // ternary operator
                const operator = new Operator();
                operator.addParam(data[0]);
                operator.addParam(data[5]);
                operator.addParam(data[9]);

                if (!data[1].length) {
                    operator.setName('between');
                } else {
                    operator.setName('between_not');
                }

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);
                expr.setOperator(operator);

                return expr;
            }),
        Pa
            .seq(
                r.compExpr,
                Pa.seq(Pa.whitespace, r.NOT).atMost(1),
                Pa.whitespace,
                r.REGEXP,
                Pa.whitespace,
                r.compExpr
            )
            .map(data => {
                const operator = new Operator();
                operator.addParam(data[0]);
                operator.addParam(data[5]);

                if (!data[1].length) {
                    operator.setName('regexp');
                } else {
                    operator.setName('not_regexp');
                }

                const expr = new Expr();
                expr.setType(Expr.Type.OPERATOR);
                expr.setOperator(operator);

                return expr;
            }),
        r.compExpr
    );

module.exports = { name: 'ILRI_EXPR', parser };
