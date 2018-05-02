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

/**
 * Enum to identify update operation types.
 * @readonly
 * @private
 * @name UpdateOperation
 * @enum {number}
 */
const UpdateType = require('../Protocol/Protobuf/Stubs/mysqlx_crud_pb').UpdateOperation.UpdateType;

/**
 * Operation object.
 * @private
 * @typedef {Object} Operation
 * @prop {number} type - operation type
 * @prop {string} source - column name
 * @prop {string} [value] - new value
 */

/**
 * Updating mixin.
 * @mixin
 * @private
 * @alias Updating
 * @param {Object} state - updating properties
 * @returns {Updating} The operation instance.
 */
function Updating (state) {
    state = Object.assign({ operations: [] }, state);

    return {
        /**
         * Retrieve the query update operations.
         * @function
         * @private
         * @name Updating#getOperations
         * @returns {Object[]} The list of operation objects.
         */
        getOperations () {
            return state.operations;
        },

        /**
         * Set the query update operations.
         * @function
         * @private
         * @name Updating#setOperations
         * @param {Object[]} criteria - list of operations
         * @returns {Updating} The query instance.
         */
        setOperations (operations) {
            state.operations = operations;

            return this;
        }
    };
}

/**
 * Update operation types.
 * @type {UpdateType}
 * @const
 * @private
 */
Updating.Operation = UpdateType;

module.exports = Updating;
