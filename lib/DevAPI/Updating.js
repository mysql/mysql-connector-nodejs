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

/**
 * Enum to identify update operation types.
 * @readonly
 * @private
 * @name UpdateOperation
 * @enum {number}
 */
const UpdateType = require('../Protocol/Stubs/mysqlx_crud_pb').UpdateOperation.UpdateType;

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
         * @name Updating#getOperations
         * @returns {Object[]} The list of operation objects.
         */
        getOperations () {
            return state.operations;
        },

        /**
         * Set the query update operations.
         * @function
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
 */
Updating.Operation = UpdateType;

module.exports = Updating;
