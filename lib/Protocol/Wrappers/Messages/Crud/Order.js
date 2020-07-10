/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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
const ParserType = require('../../../../ExprParser').Type;
const expr = require('../Expr/Expr');
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
                .filter(k => OrderStub.Direction[k] === proto.getDirection())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Order#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                expr: expr(proto.getExpr()).toJSON(),
                direction: this.getDirection()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Crud.Order instance given an expression string or object.
 * @param {string|Object} value - expression string or object
 * @param {Object} [options] - extended options
 * @returns {module:adapters.Mysqlx.Crud.Order}
 */
Order.create = function (value, options) {
    options = Object.assign({}, { type: ParserType.SORT_EXPR }, options);

    // If the value is a raw string, it needs to be transformed into a proper
    // expression abstraction (ultimately a Mysqlx.Crud.Order instance).
    if (typeof value === 'string') {
        return Order(expr.create(value, options).valueOf());
    }

    const proto = new OrderStub();
    proto.setExpr(value);

    return Order(proto);
};

module.exports = Order;
