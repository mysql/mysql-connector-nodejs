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

const ParserType = require('../../../../ExprParser').Type;
const ProjectionStub = require('../../../Stubs/mysqlx_crud_pb').Projection;
const expr = require('../Expr/Expr');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Projection
 * @param {proto.Mysqlx.Crud.Projection} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Projection}
 */
function Projection (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Projection#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                source: expr(proto.getSource()).toJSON(),
                // In this case, the value of "alias" is not an optional string
                // because the default value will be the source string
                alias: proto.getAlias()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Crud.Projection instance given an expression string or object.
 * @param {string|Object} value - expression string or object
 * @param {Object} [options] - extended options
 * @returns {module:adapters.Mysqlx.Crud.Projection}
 */
Projection.create = function (value, options) {
    options = Object.assign({}, { type: ParserType.PROJECTED_SEARCH_EXPR }, options);

    // If the value is a raw string, it needs to be transformed into a proper
    // expression abstraction (ultimately a Mysqlx.Crud.Projection instance).
    if (typeof value === 'string') {
        return Projection(expr.create(value, options).valueOf());
    }

    const proto = new ProjectionStub();
    proto.setSource(value);

    return Projection(proto);
};

module.exports = Projection;
