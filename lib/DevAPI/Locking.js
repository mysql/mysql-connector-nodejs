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

const RowLock = require('../Protocol/Stubs/mysqlx_crud_pb').Find.RowLock;

/**
 * Enum to identify row locking types.
 * @readonly
 * @private
 * @name Type
 * @enum {number}
 */
const Type = Object.assign({ NONE: 0 }, RowLock);

/**
 * Locking mixin.
 * @mixin
 * @alias Locking
 * @param {Object} state - locking properties
 * @returns {Locking}
 */
function Locking (state) {
    state = Object.assign({ rowLock: Type.NONE }, state);

    return {
        /**
         * Retrieve the type of row lock used by the query.
         * @function
         * @private
         * @name Locking#getRowLock
         * @returns {Type} The lock type enum value.
         */
        getRowLock () {
            return state.rowLock;
        },

        /**
         * Use a shared lock for the query.
         * @function
         * @name Locking#lockShared
         * @returns {Locking} The query instance.
         */
        lockShared () {
            return this.setRowLock(Type.SHARED_LOCK);
        },

        /**
         * Use an exclusive lock for the query.
         * @function
         * @name Locking#lockExclusive
         * @returns {Locking} The query instance.
         */
        lockExclusive () {
            return this.setRowLock(Type.EXCLUSIVE_LOCK);
        },

        /**
         * Set the type of row lock used by the query.
         * @function
         * @private
         * @name Locking#setRowLock
         * @param {Type} rowLock - lock type enum value
         * @returns {Locking} The query instance.
         */
        setRowLock (rowLock) {
            state.rowLock = rowLock;

            return this;
        }
    };
}

/**
 * Row locking types.
 * @type {Type}
 * @const
 */
Locking.Type = Type;

module.exports = Locking;
