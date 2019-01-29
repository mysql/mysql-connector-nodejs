/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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

const RowLock = require('../Protocol/Protobuf/Stubs/mysqlx_crud_pb').Find.RowLock;
const RowLockOptions = require('../Protocol/Protobuf/Stubs/mysqlx_crud_pb').Find.RowLockOptions;
const preparing = require('./Preparing');

/**
 * Enum to identify row locking types.
 * @readonly
 * @private
 * @name Type
 * @enum {number}
 */
const Type = Object.assign({ NONE: 0 }, RowLock);

/**
 * Enum to identify row locking modes.
 * @readonly
 * @name LockContention
 * @enum {number}
 * @example
 * LockContention.NOWAIT
 * LockContention.SKIP_LOCKED
 */
const LockContention = Object.assign({ DEFAULT: 0 }, RowLockOptions);

/**
 * Locking mixin.
 * @mixin
 * @alias Locking
 * @param {Object} state - locking properties
 * @returns {Locking}
 */
function Locking (state) {
    state = Object.assign({ mode: LockContention.DEFAULT, rowLock: Type.NONE, preparable: preparing() }, state);

    return {
        /**
         * Retrieve the mode used by the current row lock type.
         * @function
         * @private
         * @name Locking#getLockContention
         * @returns {LockContention} The row lock mode enum value.
         */
        getLockContention () {
            return state.mode;
        },

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
         * @param {LockContention} [mode] - row locking mode
         * @example
         * collection.find().lockShared();
         * collection.find().lockShared(mysqlx.LockContention.NOWAIT)
         * collection.find().lockShared(mysqlx.LockContention.SKIP_LOCKED)
         * @returns {Locking} The query instance.
         */
        lockShared (mode) {
            state.preparable.forceRestart();

            return this.setRowLock(Type.SHARED_LOCK).setLockContention(mode);
        },

        /**
         * Use an exclusive lock for the query.
         * @function
         * @name Locking#lockExclusive
         * @param {LockContention} [mode] - row locking mode
         * @example
         * collection.find().lockExclusive();
         * collection.find().lockExclusive(mysqlx.LockContention.NOWAIT)
         * collection.find().lockExclusive(mysqlx.LockContention.SKIP_LOCKED)
         * @returns {Locking} The query instance.
         */
        lockExclusive (mode) {
            state.preparable.forceRestart();

            return this.setRowLock(Type.EXCLUSIVE_LOCK).setLockContention(mode);
        },

        /**
         * Set the mode of the current row lock.
         * @function
         * @private
         * @name Locking#setLockContention
         * @param {LockContention} mode - lock mode enum value
         * @returns {Locking} The query instance.
         */
        setLockContention (mode) {
            mode = mode || LockContention.DEFAULT;

            if (!Object.keys(LockContention).some(c => LockContention[c] === mode)) {
                throw new Error('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
            }

            state.mode = mode;

            return this;
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

/**
 * Row locking modes.
 * @type {LockContention}
 * @const
 */
Locking.LockContention = LockContention;

module.exports = Locking;
