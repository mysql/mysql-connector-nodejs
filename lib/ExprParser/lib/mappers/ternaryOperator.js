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
