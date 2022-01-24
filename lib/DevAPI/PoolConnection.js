/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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

const connection = require('./Connection');
const system = require('../system');

/**
 * API for connections to be used by a connection pool.
 * @private
 * @module PoolConnection
 * @mixes module:Connection
 */

/**
 * @private
 * @alias module:PoolConnection
 * @param {Object} [options] - client properties (connection and pooling configuration)
 * @returns {module:PoolConnection}
 */
function PoolConnection (options = { pooling: {} }) {
    // Object to keep special pooling related state.
    // Will also contain whatever state is managed by the connection instance
    // that is mixed-in.
    const state = { releasedAt: null };

    return Object.assign({}, connection(options), {
        /**
         * Activate a connection that has been aquired from the pool.
         * @private
         * @function
         * @name module:PoolConnection#acquire
         * @returns {module:PoolConnection}
         */
        acquire () {
            // Acquiring a connection just means to signal it is not released.
            state.releasedAt = null;
            return this;
        },

        /**
         * Release a connection that has been returned back to the pool.
         * @private
         * @function
         * @name module:PoolConnection#close
         * @returns {Promise} Returns a promise just to keep consistency with standalone connections
         */
        close () {
            state.releasedAt = system.time();
            return Promise.resolve();
        },

        /**
         * Checks if a connection is idle and has expired (maxIdleTime has been exceeded).
         * @private
         * @function
         * @name module:PoolConnection#isExpired
         * @returns {boolean}
         */
        isExpired () {
            // If the connection has not been released yet, then it has not
            // expired as well.
            if (state.releasedAt === null) {
                return false;
            }

            const maxIdleTime = options.pooling.maxIdleTime;

            // If maxIdleTime = 0, it means an idle connection never expires.
            if (maxIdleTime === 0) {
                return false;
            }

            // Otherwise, we should check if the connection was released for
            // more than the value of maxIdleTime.
            return system.time() - state.releasedAt > options.pooling.maxIdleTime;
        },

        /**
         * Tells anyone that this is a connection from a pool.
         * @private
         * @function
         * @name module:PoolConnection#isFromPool
         * @returns {boolean} Always returns true
         */
        isFromPool () {
            return true;
        },

        /**
         * Checks if a connection is idle (has been released back into the pool).
         * @private
         * @function
         * @name module:PoolConnection#isIdle
         * @returns {boolean}
         */
        isIdle () {
            return !!state.releasedAt;
        }
    });
}

module.exports = PoolConnection;
