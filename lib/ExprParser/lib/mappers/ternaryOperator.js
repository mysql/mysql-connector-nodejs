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

const Expr = require('../stubs/mysqlx_expr_pb.js').Expr;
const Operator = require('../stubs/mysqlx_expr_pb.js').Operator;

function ternaryOperator (operations, index) {
    index = index || 0;

    const operator = new Operator();
    operator.setName(operations[index].operator);

    if (operations[index].operands.length < 3) {
        operator.addParam(ternaryOperator(operations, index + 1));
    }

    operations[index].operands.forEach(operand => {
        operator.addParam(operand);
    });

    const expr = new Expr();
    expr.setType(Expr.Type.OPERATOR);
    expr.setOperator(operator);

    return expr;
}

module.exports = function (data) {
    if (!data[1].length) {
        return data[0];
    }

    const operations = Array.from(data[1]);
    operations[0].operands = [data[0]].concat(operations[0].operands);
    operations.reverse();

    return ternaryOperator(operations);
};
