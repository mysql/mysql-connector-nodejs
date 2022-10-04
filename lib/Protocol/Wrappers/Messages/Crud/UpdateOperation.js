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

const CrudStub = require('../../../Stubs/mysqlx_crud_pb');
const columnIdentifier = require('../Expr/ColumnIdentifier');
const expr = require('../Expr/Expr');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.UpdateOperation
 * @param {proto.Mysqlx.Crud.UpdateOperation} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.UpdateOperation}
 */
function UpdateOperation (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the type name of the update operation.
         * @function
         * @name module:adapters.Mysqlx.Crud.UpdateOperation#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(CrudStub.UpdateOperation.UpdateType)
                .filter(k => CrudStub.UpdateOperation.UpdateType[k] === proto.getOperation())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.UpdateOperation#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                source: columnIdentifier(proto.getSource()).toJSON(),
                operation: this.getType(),
                value: expr(proto.getValue()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.UpdateOperation protobuf message given
 * the type of an update operation, the column or field it should apply to, and,
 * optionally new value that should be part of that operation alongside a flag
 * that determines if the value is a literal or a computed expression.
 * @private
 * @param {number} type - The operation type (as defined by
 * Mysqlx.Crud.UpdateOperation.UpdateType).
 * @param {ExpressionTree} source - Expression that identifies the document
 * field or column name to which the update applies to.
 * @param {*} [value]
 * @param {boolean} [isLiteral] - Determines whether the value is a literal
 * or a computed expression.
 * @returns {module:adapters.Mysqlx.Crud.UpdateOperation}
 */
UpdateOperation.create = function ({ type, source, value, isLiteral } = {}) {
    const proto = new CrudStub.UpdateOperation();
    proto.setSource(columnIdentifier.create(source).valueOf());
    proto.setOperation(type);

    if (typeof value === 'undefined') {
        return UpdateOperation(proto);
    }

    proto.setValue(expr.create({ value, isLiteral }).valueOf());

    return UpdateOperation(proto);
};

module.exports = UpdateOperation;
