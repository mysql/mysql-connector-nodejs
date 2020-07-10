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
 * Creates a wrapper of a generic Mysqlx.Crud.UpdateOperation instance for a given object.
 * @param {Object} op - operation parameters
 * @param {Object} [options] - extended options
 * @returns {module:adapters.Mysqlx.Crud.UpdateOperation}
 */
UpdateOperation.create = function (op, options) {
    options = Object.assign({}, options);

    const proto = new CrudStub.UpdateOperation();

    proto.setSource(columnIdentifier.create(op.source, options).valueOf());
    proto.setOperation(op.type);

    // ITEM_REMOVE operations should not contain any value
    if (op.type === CrudStub.UpdateOperation.UpdateType.ITEM_REMOVE) {
        return UpdateOperation(proto);
    }

    // the value should not be parsed (X Plugin limitation)
    proto.setValue(expr.create(op.value, Object.assign({}, options, { toParse: false })).valueOf());

    return UpdateOperation(proto);
};

module.exports = UpdateOperation;
