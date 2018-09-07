/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
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

const connectionPool = require('./ConnectionPool');
const validator = require('./Util/validator');

/**
 * Client connection pool factory.
 * @module Client
 */

/**
 * @alias module:Client
 * @param {Object} [state] - default client state
 * @returns {module:Client}
 */
function Client (state) {
    const defaultState = { pool: null, pooling: { enabled: true }, uri: {} };
    validator.validate(state, defaultState, { module: 'Client' });

    state = Object.assign(defaultState, { pool: connectionPool(state.pooling || defaultState.pooling) }, state);

    return {
        /**
         * Pool destructor (closes and cleans up all the connections in the pool).
         * @function
         * @name module:Client#close
         * @example
         * const client = mysqlx.getClient({ user: 'root' }, { pooling: { enabled: true, maxSize: 3 } })
         *
         * client.getSession()
         *   .then(() => client.close());
         * @returns {Promise}
         */
        close () {
            if (!state.pool) {
                return Promise.reject(new Error('Cannot close the pool. Maybe it has been destroyed already.'));
            }

            return state.pool.destroy().then(() => { state.pool = null; });
        },

        /**
         * Retrieve a connection from the pool if one is available.
         * @function
         * @name module:Client#getSession
         * @example
         * const client = mysqlx.getClient({ user: 'root' }, { pooling: { enabled: true, maxSize: 3 } })
         *
         * client.getSession()
         *   .then(session => {
         *     console.log(session.inspect()); // { pooling: true, ... }
         *   })
         * @returns {Promise<Session>} The active session instance.
         */
        getSession () {
            if (!state.pool) {
                return Promise.reject(new Error('Cannot retrieve a connection from the pool. Maybe it has been destroyed already.'));
            }

            try {
                state.pool.start(state.uri);
            } catch (err) {
                return Promise.reject(err);
            }

            return state.pool.acquire();
        }
    };
}

module.exports = Client;
