/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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
const RowLockOptions = require('../Protocol/Stubs/mysqlx_crud_pb').Find.RowLockOptions;
const errors = require('../constants/errors');
const preparing = require('./Preparing');

/**
 * Enum to identify row locking types.
 * @readonly
 * @private
 * @name Locking.Type
 * @enum {number}
 * @example
 * Type.NONE
 * Type.EXCLUSIVE_LOCK
 * Type.SHARED_LOCK
 */
const Type = Object.assign({ NONE: 0 }, RowLock);

/**
 * Enum to identify row locking modes.
 * @readonly
 * @name Locking.LockContention
 * @enum {number}
 * @example
 * LockContention.DEFAULT
 * LockContention.NOWAIT
 * LockContention.SKIP_LOCKED
 * @see {@link https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html#innodb-locking-reads-nowait-skip-locked|Locking Read Concurrency with NOWAIT and SKIP LOCKED}
 */
const LockContention = Object.assign({ DEFAULT: 0 }, RowLockOptions);

/**
 * This mixin grants the capability of locking reads, within an underlying
 * transaction for a lookup statement, via composition.
 * @mixin
 * @alias Locking
 * @param {Object} state - locking properties
 * @returns {Locking}
 * @see {@link https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html|Locking Reads}
 */
function Locking (state) {
    state = Object.assign({ mode: LockContention.DEFAULT, lock: Type.NONE, preparable: preparing() }, state);

    return {
        /**
         * Retrieves the mode used by the current row lock type.
         * @function
         * @private
         * @name Locking#getLockOptions_
         * @returns {LockContention} The row lock mode enum value.
         */
        getLockOptions_ () {
            return state.mode;
        },

        /**
         * Retrieves the type of row lock used by the query.
         * @function
         * @private
         * @name Locking#getLock_
         * @returns {Type} The lock type enum value.
         */
        getLock_ () {
            return state.lock;
        },

        /**
         * Uses a shared mode lock on any records or documents that are read
         * by the statement, where other sessions can also read the same
         * records or documents but cannot modify them until the transaction
         * commits.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Locking#lockShared
         * @param {LockContention} [mode] - A value that determines the locking
         * concurrency options.
         * @example
         * collection.find().lockShared();
         * collection.find().lockShared(mysqlx.LockContention.NOWAIT)
         * collection.find().lockShared(mysqlx.LockContention.SKIP_LOCKED)
         * @returns {Locking} The instance of the statement itself
         * following a fluent API convention.
         */
        lockShared (mode) {
            state.preparable.forceRestart();

            return this.setLock_(Type.SHARED_LOCK).setLockOptions_(mode);
        },

        /**
         * Uses a exclusive mode lock on any records or documents that are read
         * by the statement, where other sessions cannot even read the same
         * records or documents until the transaction commits.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Locking#lockExclusive
         * @param {LockContention} [mode] - A value that determines the locking
         * concurrency options.
         * @example
         * collection.find().lockExclusive();
         * collection.find().lockExclusive(mysqlx.LockContention.NOWAIT)
         * collection.find().lockExclusive(mysqlx.LockContention.SKIP_LOCKED)
         * @returns {Locking} Instance of the statement itself
         * following a fluent API convention.
         */
        lockExclusive (mode) {
            state.preparable.forceRestart();

            return this.setLock_(Type.EXCLUSIVE_LOCK).setLockOptions_(mode);
        },

        /**
         * Establishes the concurrency options for the current lock.
         * @function
         * @private
         * @name Locking#setLockOptions_
         * @param {LockContention} mode - A value that determines the locking
         * concurrency options.
         * @returns {Locking} Instance of the statement itself
         * following a fluent API convention.
         */
        setLockOptions_ (mode) {
            mode = mode || LockContention.DEFAULT;

            if (!Object.keys(LockContention).some(c => LockContention[c] === mode)) {
                throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_LOCK_CONTENTION_MODE);
            }

            state.mode = mode;

            return this;
        },

        /**
         * Sets the type of lock used by the statement.
         * @function
         * @private
         * @name Locking#setLock_
         * @param {Type} lock - A value that determines the locking
         * concurrency options.
         * @returns {Locking} Instance of the statement itself
         * following a fluent API convention.
         */
        setLock_ (lock) {
            state.lock = lock;

            return this;
        }
    };
}

// Export contants.
Locking.Type = Type;
Locking.LockContention = LockContention;

module.exports = Locking;
