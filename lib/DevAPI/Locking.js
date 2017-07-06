'use strict';

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

const LOCK = { NONE: 0, SHARED: 1, EXCLUSIVE: 2 };

/**
 * Locking mixin.
 * @mixin
 * @alias Locking
 * @param {Object} state - locking properties
 * @returns {Locking}
 */
function Locking (state) {
    state = Object.assign({ lockingMode: LOCK.NONE }, state);

    return {
        /**
         * Use a shared lock for the operation.
         * @function
         * @name Locking#lockShared
         * @returns {Locking} The operation instance.
         */
        lockShared () {
            state.lockingMode = LOCK.SHARED;
            return this;
        },

        /**
         * Use an exclusive lock for the operation.
         * @function
         * @name Locking#lockExclusive
         * @returns {Locking} The operation instance.
         */
        lockExclusive () {
            state.lockingMode = LOCK.EXCLUSIVE;
            return this;
        },

        /**
         * Retrieve the operation locking mode.
         * @function
         * @name Locking#getLockingMode
         * @returns {number}
         */
        getLockingMode () {
            return state.lockingMode;
        }
    };
}

Locking.NONE = LOCK.NONE;
Locking.SHARED = LOCK.SHARED;
Locking.EXCLUSIVE = LOCK.EXCLUSIVE;

module.exports = Locking;
