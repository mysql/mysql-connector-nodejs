/*
 * Copyright (c) 2018, 2022, Oracle and/or its affiliates.
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
const errors = require('../constants/errors');
const pool = require('./ConnectionPool');
const session = require('./Session');
const util = require('util');
const { isValidPlainObject } = require('../validator');

/**
 * Client abstraction to manage connections to the database, at the moment,
 * only using an internal connection pool.
 * @module Client
 * @example
 * const mysqlx = require('@mysqlx/xdevapi')
 * const client = mysqlx.getClient('mysqlx://root@localhost')
 *
 * return client.getSession()
 *   .then(session => {
 *     // A new session is created using a connection from the pool.
 *   })
 */

/**
 * Extended client options.
 * @typedef {Object} Properties
 * @prop {module:ConnectionPool~Properties} [pooling] - connection pool configuration
 */
const VALID_OPTIONS = ['pooling'];

/**
 * @private
 * @alias module:Client
 * @param {Object} [state] - default client state
 * @returns {module:Client}
 */
function Client (options = {}) {
    const state = { pool: null, connection: null };

    return {
        /**
         * Client destructor (closes and cleans up all the connections in the pool).
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
            if (options.pooling.enabled && state.pool === null) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_POOL_CLOSED));
            }

            if (!options.pooling.enabled && state.connection === null) {
                return Promise.resolve();
            }

            if (!options.pooling.enabled) {
                return state.connection.destroy()
                    .then(() => {
                        state.connection = null;
                    });
            }

            return state.pool.destroy()
                .then(() => {
                    state.pool = null;
                });
        },

        /**
         * Create a new session using a connection from the pool (if one is available).
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
            if (!options.pooling.enabled) {
                state.connection = connection(options);

                return state.connection.open()
                    .then(con => {
                        return session(con);
                    });
            }

            state.pool = state.pool || pool(options).create();

            return state.pool.getConnection()
                .then(con => {
                    // If the connection does not exist, probably because
                    // the pool was closed in the meantime, there is nothing
                    // else to do.
                    if (!con) {
                        return;
                    }

                    return session(con);
                });
        }
    };
}

/**
 * Validate the entire set of properties used to create a client.
 * @private
 * @param {Object} options - a mix of connection and extended client properties
 * @returns {boolean} Returns "true" if all properties and values are valid.
 * @throws when either the connection or connection pool properties are not
 * valid as well as when they contain unknown properties
 */
Client.validate = function (options) {
    // Validate the connection options.
    connection.validate(options);

    // Validate the client options.
    const validKeys = VALID_OPTIONS.concat(connection.VALID_OPTIONS);
    const invalidKeys = Object.keys(options).filter(k => validKeys.indexOf(k) === -1);

    if (invalidKeys.length) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, invalidKeys[0]));
    }

    if (!isValidPlainObject({ value: options.pooling })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling', options.pooling));
    }

    // Assign proper default values to missing pooling options.
    options.pooling = Object.assign({ enabled: true, maxIdleTime: 0, maxSize: 25, queueTimeout: 0 }, options.pooling);

    // Validate the pooling options.
    return pool.validate(options.pooling);
};

Client.VALID_OPTIONS = VALID_OPTIONS;

module.exports = Client;
