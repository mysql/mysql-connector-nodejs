/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const LimitExprStub = require('../../../Stubs/mysqlx_crud_pb').LimitExpr;
const expr = require('../../Messages/Expr/Expr');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.LimitExpr
 * @param {proto.Mysqlx.Crud.LimitExpr} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.LimitExpr}
 */
function LimitExpr (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.LimitExpr#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            // Mysqlx.Crud.Limit and Mysqlx.Crud.LimitExpr are exclusive which
            // means one of them will be undefined.
            if (typeof proto === 'undefined') {
                // In that case, we want the field to be ignored in the parent object.
                return;
            }

            return {
                row_count: expr(proto.getRowCount()).toJSON(),
                offset: expr(proto.getOffset()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.LimitExpr protobuf message given a count,
 * optionally, an offset and the size of the existing placeholder value list, to
 * which the the values for the count and the offset are appended.
 * @private
 * @param {number} count
 * @param {number} [offset]
 * @param {number} [position] - Length of the list of placeholders being
 * used by the expression.
 * @returns {module:adapters.Mysqlx.Crud.LimitExpr}
 */
LimitExpr.create = function ({ count, offset, position = 0 } = {}) {
    // If the count is not defined there's nothing to do.
    // We can't wrap an empty Mysqlx.Crud.Limit stub instance because it
    // contains a default value of an empty Mysqlx.Expr.Expr for row_count,
    // which in turn, gets assigned a default type creating some
    // inconsistencies.
    if (typeof count === 'undefined') {
        return LimitExpr();
    }

    const proto = new LimitExprStub();

    proto.setRowCount(expr.create({ value: count, position, isLiteral: true }).valueOf());

    if (typeof offset !== 'undefined') {
        proto.setOffset(expr.create({ value: offset, position: position + 1, isLiteral: true }).valueOf());
    }

    return LimitExpr(proto);
};

module.exports = LimitExpr;
