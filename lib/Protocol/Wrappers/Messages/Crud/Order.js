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

const OrderStub = require('../../../Stubs/mysqlx_crud_pb').Order;
const Expr = require('../Expr/Expr');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Order
 * @param {proto.Mysqlx.Crud.Order} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Order}
 */
function Order (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the ordering direction identifier.
         * @function
         * @name module:adapters.Mysqlx.Crud.Order#getDirection
         * @returns {string}
         */
        getDirection () {
            return Object.keys(OrderStub.Direction)
                .find(k => OrderStub.Direction[k] === proto.getDirection());
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Order#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                expr: Expr(proto.getExpr()).toJSON(),
                direction: this.getDirection()
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.Order protobuf message given an
 * expression that identifies a column or a field and, optionally, the
 * direction it should be sorted.
 * @private
 * @param {ExpressionTree} expr - Expression tree that represents the
 * column or field.
 * @param {string} [direction] - Direction from which the result set
 * should be sorted.
 * @returns {module:adapters.Mysqlx.Crud.Order}
 */
Order.create = ({ expr, direction = 'ASC' }) => {
    const proto = new OrderStub();
    proto.setExpr(Expr.create({ value: expr }).valueOf());
    // From the MySQL server standpoint, the direction is case-insensitive.
    // However, in order to retrieve the corresponding enum value, we need to
    // convert it to upper case.
    proto.setDirection(OrderStub.Direction[direction.toUpperCase()]);

    return Order(proto);
};

module.exports = Order;
