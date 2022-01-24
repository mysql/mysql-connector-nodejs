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

const connection = require('./PoolConnection');
const errors = require('../constants/errors');
const system = require('../system');
const util = require('util');
const { isValidBoolean, isValidInteger } = require('../validator');

/**
 * XDevAPI implementation of a connection pool. Should be used via the {@link module:Client|Client} API.
 * @module ConnectionPool
 * @example
 * const pool = mysqlx.getClient('mysqlx://root@localhost', {
 *   pooling: {
 *     enabled: true,
 *     maxSize: 10,
 *     maxIdleTime: 20000,
 *     queueTimeout: 5000
 *   }
 * })
 *
 * pool.getSession()
 *   .then(session => {
 *     // A new session is created using a connection from the pool.
 *   })
 */

/**
 * Connection pool configuration properties.
 * @typedef {Object} Properties
 * @prop {boolean} [enabled=true] - use a connection pool
 * @prop {number} [maxSize=25] - maximum number of connections in the pool
 * @prop {number} [maxIdleTime=0] - maximum number of milliseconds to allow a connection to be idle (0 - infinite)
 * @prop {number} [queueTimeout=0] - maximum number of milliseconds to wait for a connection to become available (0 - infinite)
 */
const VALID_OPTIONS = ['enabled', 'maxIdleTime', 'maxSize', 'queueTimeout'];

/**
 * @private
 * @alias module:ConnectionPool
 * @param {Object} [options] - pooling options
 * @returns {module:ConnectionPool}
 */
function ConnectionPool (options = {}) {
    // Internal pool state containing a list of connections
    // given their current state.
    const state = {
        // Contains the list of active connections i.e. that have not been
        // closed neither by the client nor the server.
        active: [],
        // Informs if the pool is avaiable or not. After it starts to be
        // destroyed, it should become unavailable.
        available: true,
        // Contains the list of connections that have expired i.e. where
        // maxIdleTime was exceeded or have been closed by the server.
        expired: [],
        // Contains the list of connections that became idle i.e. have been
        // closed by the client.
        idle: [],
        // Keep track of the number of reserved slots in order to ensure
        // connections are only created when there is space in the pool.
        tickets: 0
    };

    return {
        /**
         * Returns the current list of active connections in the pool.
         * @private
         * @function
         * @name module:ConnectionPool#activeConnections
         * @returns {Array<PoolConnection>} The list of connection instances.
         */
        activeConnections () {
            return state.active;
        },

        /**
         * Returns the current list of idle connections in the pool.
         * @private
         * @function
         * @name module:ConnectionPool#idleConnections
         * @param {Object} [state={}] - The initial state of the pool.
         * @param {Array<PoolConnection>} [state.active=[]] - A list of active connections
         * @param {Array<PoolConnection>} [state.idle=[]] - A list of idle connections
         * @param {Array<PoolConnection>} [state.expired=[]] - A list of expired connections.
         * @returns {ConnectionPool} The pool instance.
         */
        create ({ active = [], expired = [], idle = [] } = {}) {
            state.active = active;
            state.available = true;
            state.expired = expired;
            state.idle = idle;
            state.tickets = active.length;

            return this;
        },

        /**
         * Close all the connections in the pool.
         * @private
         * @function
         * @name module:ConnectionPool#destroy
         * @returns {Promise}
         */
        destroy () {
            // We should put the pool in a state that prevents queued
            // connection requests from being fulfilled.
            state.available = false;
            // Expired connections have already been destroyed by this point.
            return Promise.all(state.idle.concat(state.active).map(con => con.destroy()))
                .then(() => {
                    return this.reset();
                })
                .catch(err => {
                    this.reset();
                    throw err;
                });
        },

        /**
         * Returns the current list of expired connections in the pool.
         * @private
         * @function
         * @name module:ConnectionPool#expiredConnections
         * @returns {Array<PoolConnection>} The list of connection instances.
         */
        expiredConnections () {
            return state.expired;
        },

        /**
         * Retrieve a usable connection from the pool.
         * If there are idle connections available on is returned.
         * If there are no idle connections available and the pool is not
         * full, either an expired connection is re-created or a new
         * connection is created.
         * If the pool is full, it will wait until queueTimeout is reached.
         * Every time this function is called, the list of connections
         * is updated according to the status of each connection.
         * @private
         * @function
         * @name module:ConnectionPool#getConnection
         * @throws Will return a rejected Promise if queueTimeout is exceeded.
         * @returns {Promise<PoolConnection>}
         */
        getConnection (requestedAt = system.time()) {
            return this.update()
                .then(() => {
                    // If previous connection requests were queued and the
                    // pool is closed or being closed, we should not try to
                    // create, refurbish or re-use connections at the risk of
                    // leaving a system socket open which will be not cleaned
                    // up after the process finishes, leading to a resource
                    // leak. There is nothing else left to do.
                    if (!this.isAvailable()) {
                        return;
                    }

                    const elapsedTime = system.time() - requestedAt;
                    const queueTimeout = options.pooling.queueTimeout;

                    const postConnect = con => {
                        // The connection needs to be blocked from being released.
                        con.acquire();
                        // The connection should be moved to the active list.
                        state.active.push(con);
                        // And returned back to the X DevAPI client.
                        return con;
                    };

                    // Use an existing connection or create a new one.
                    // If the pool is full, it means the idle and expired
                    // queues are empty and the connection will be undefined.
                    const con = state.idle.shift() || state.expired.shift();

                    // If the pool is full (all the connections are active) we
                    // need to check if the time elapsed since the previous
                    // attempt to retrieve the connection from the pool. If
                    // it exceeds the value of queueTimeout we need to throw
                    // an error. However, if queueTimeout = 0 that means it
                    // is supposed to be infinite, so, in that case, we do not
                    // throw an error and need to try indefinitely.
                    if (this.isFull() && queueTimeout !== 0 && elapsedTime >= queueTimeout) {
                        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_POOL_QUEUE_TIMEOUT, queueTimeout));
                    }

                    // If the pool is full and the elapsed time since the last
                    // attempt to retrieve the connection does not exceed the
                    // value of queueTimeout (which can be infinite), we need
                    // to attempt to retrieve the connection again, given a
                    // proper sliding window. In this case, the next attempt
                    // will happen only after the same time it passed since
                    // the last check.
                    // If the connection is expired but is still being closed,
                    // which can happen with parallel connection requests, we
                    // also need to queue the request.
                    if (this.isFull() || (con && con.isClosing())) {
                        return new Promise((resolve, reject) => setTimeout(() => this.getConnection(requestedAt).then(resolve).catch(reject), elapsedTime));
                    }

                    // Given the connection is only considered active after it
                    // is effectively created. Due to the asynchronous nature
                    // of the pool, in the presence of parallel connection
                    // requests, we need to create a ticket for each
                    // connection that can and will start to be created.
                    state.tickets += 1;

                    // If there is an idle connection which has not been
                    // closed and has not expired ("maxIdleTime" still has
                    // not been exceeded) we can re-use it.
                    if (con && con.isOpen() && !con.isExpired()) {
                        return con.override().then(postConnect);
                    }

                    // If the connection is not open or has expired, we need
                    // to refurbish the same instance, to ensure the endpoint
                    // availability is up-to-date.
                    if (con) {
                        return con.open().then(postConnect);
                    }

                    // Otherwise we need to create a new one.
                    return connection(options).open().then(postConnect);
                });
        },

        /**
         * Returns the current list of idle connections in the pool.
         * @private
         * @function
         * @name module:ConnectionPool#idleConnections
         * @returns {Array<PoolConnection>} The list of connection instances.
         */
        idleConnections () {
            return state.idle;
        },

        /**
         * Checks if the pool is being closed.
         * @private
         * @function
         * @name module:ConnectionPool#isAvailable
         * @returns {boolean}
         */
        isAvailable () {
            return state.available;
        },

        /**
         * Checks if a pool is full i.e. a total of "maxSize" number of
         * connections are currently active.
         * @private
         * @function
         * @name module:ConnectionPool#isFull
         * @returns {boolean}
         */
        isFull () {
            // A connection pool is full if the current number of tickets is
            // equal to the maximum size of the pool.
            return state.tickets === options.pooling.maxSize;
        },

        /**
         * Reset the pool state.
         * @private
         * @function
         * @name module:ConnectionPool#reset
         * @returns {module:ConnectionPool} The pool instance.
         */
        reset () {
            state.active = [];
            // The original pool instance will never be available again.
            // A new one should be created by the client wrapper.
            state.available = false;
            state.expired = [];
            state.idle = [];
            state.tickets = 0;

            return this;
        },

        /**
         * Update the list of connections given their current state.
         * @private
         * @function
         * @name module:ConnectionPool#update
         * @returns {Promise}
         */
        update () {
            // A connection can be closed from the server side, which means
            // there is a chance that the active connection queue contains
            // connections that have been closed. If that is the case, those
            // should become expired.
            const openActiveConnections = state.active.filter(c => c.isOpen());
            const closedActiveConnections = state.active.filter(c => !c.isOpen());
            const releasedActiveConnections = state.active.filter(c => c.isIdle());

            state.expired = state.expired.concat(closedActiveConnections);
            state.active = openActiveConnections;

            // The number of reserved slots should decrease given the
            // number of connections that are no longer active.
            state.tickets = state.tickets - closedActiveConnections.length - releasedActiveConnections.length;

            // Active connections that have been closed by the application
            // should be released back into the pool, which means they become
            // idle.
            const validActiveConnections = state.active.filter(c => !c.isIdle());

            state.idle = state.idle.concat(releasedActiveConnections);
            state.active = validActiveConnections;

            // Idle connections can also have expired (when "maxIdleTime" has
            // been exceeded).
            const expiredIdleConnections = state.idle.filter(c => c.isExpired());
            const validIdleConnections = state.idle.filter(c => !c.isExpired());

            state.expired = state.expired.concat(expiredIdleConnections);
            state.idle = validIdleConnections;

            // Expired connections should be destroyed.
            return Promise.all(state.expired.map(con => con.destroy()));
        }
    };
}

ConnectionPool.validate = function (options) {
    const invalidKeys = Object.keys(options).filter(k => VALID_OPTIONS.indexOf(k) === -1);

    if (invalidKeys.length) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, `pooling.${invalidKeys[0]}`));
    }

    const { enabled, maxIdleTime, maxSize, queueTimeout } = options;

    if (!isValidBoolean({ value: enabled })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.enabled', enabled));
    }

    if (!isValidInteger({ value: maxIdleTime, min: 0 })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.maxIdleTime', maxIdleTime));
    }

    if (!isValidInteger({ value: maxSize, min: 1 })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.maxSize', maxSize));
    }

    if (!isValidInteger({ value: queueTimeout, min: 0 })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling.queueTimeout', queueTimeout));
    }

    return true;
};

ConnectionPool.VALID_OPTIONS = VALID_OPTIONS;

module.exports = ConnectionPool;
