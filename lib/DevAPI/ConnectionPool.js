/*
 * Copyright (c) 2019, 2020, Oracle and/or its affiliates. All rights reserved.
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

const Session = require('./Session');
const validator = require('./Util/validator');

/**
 * ConnectionPool factory.
 * @module ConnectionPool
 * @private
 */

/**
 * @private
 * @alias module:ConnectionPool
 * @param {Object} [state] - default pool state
 * @returns {module:ConnectionPool}
 */
function ConnectionPool (state) {
    const defaultState = { active: [], enabled: true, idle: [], maxIdleTime: 0, maxSize: 25, queueTimeout: 0 };

    const invalidValues = {
        maxIdleTime: () => state.maxIdleTime < 0,
        maxSize: () => state.maxSize <= 0,
        queueTimeout: () => state.queueTimeout < 0
    };

    validator.validate(state, defaultState, { module: 'Client', path: 'pooling', invalidValues });

    state = Object.assign({}, defaultState, state);

    return {
        /**
         * Retrieve a usable (idle) connection from the pool within the specified time boundaries.
         * @function
         * @name module:ConnectionPool#acquire
         * @returns {Promise<Session>}
         */
        acquire (startedAt) {
            startedAt = startedAt || Date.now();

            const delay = (startedAt) => new Promise((resolve, reject) => {
                const now = Date.now();
                // we can use the time gap between this attempt and the last to determine when the next attempt should be made
                const testedAt = now - startedAt;

                setTimeout(() => {
                    if (state.queueTimeout === 0) {
                        return this.acquire().then(resolve).catch(reject);
                    }

                    if (testedAt < state.queueTimeout) {
                        return this.acquire(startedAt).then(resolve).catch(reject);
                    }

                    return reject(new Error(`Could not retrieve a connection from the pool. Timeout of ${state.queueTimeout} ms was exceeded.`));
                }, testedAt);
            });

            return this.refresh()
                .then(() => {
                    if (state.active.length === state.maxSize) {
                        return delay(startedAt);
                    }

                    const session = this.pick();

                    if (!session._isValid && !session._isOpen) {
                        return session.connect();
                    }

                    return session.reset().catch(() => session.connect());
                });
        },

        /**
         * Clear the pool state.
         * @function
         * @name module:ConnectionPool#clear
         * @returns {module:ConnectionPool} The pool instance.
         */
        clear () {
            state.active = [];
            state.idle = [];

            return this;
        },

        /**
         * Close all the connections in the pool.
         * @function
         * @name module:ConnectionPool#destroy
         * @returns {Promise}
         */
        destroy () {
            return Promise.all(state.idle.concat(state.active).map(session => session.done()))
                // TODO(Rui): after BUG#28471569 gets a fix, a Mysqlx.Connection.Close message should be sent.
                .then(() => {
                    this.clear();
                })
                .catch(() => {
                    this.clear();
                });
        },

        /**
         * Pick an idle connection from the pool and activate it.
         * @function
         * @name module:ConnectionPool#pick
         * @returns {Session}
         */
        pick () {
            const session = state.idle.shift();
            // timestamps are not needed for active connections
            delete session.timestamp;

            state.active.push(session);

            if (!state.enabled) {
                // keep the legacy interface behavior
                session.close = () => session.disconnect().then(() => { this.clear(); });
                session.done = session.close;
            } else {
                session.done = Session.prototype.disconnect;
                session.close = () => this.release(session);
            }

            return session;
        },

        /**
         * Cleanup idle connections which exceed the timeout.
         * @function
         * @name module:ConnectionPool#refresh
         * @returns {Promise}
         */
        refresh () {
            if (state.maxIdleTime === 0) {
                return Promise.resolve();
            }

            const sessions = state.idle.filter(session => session.timestamp && (Date.now() - session.timestamp > state.maxIdleTime));

            return Promise.all(sessions.map(session => session.close()));
        },

        /**
         * Release an active connection from the pool and deactivate it.
         * @function
         * @name module:ConnectionPool#release
         * @returns {module:ConnectionPool} The pool instance.
         */
        release (session) {
            const id = state.active.indexOf(session);

            // should be indempotent
            if (!state.active[id]) {
                return Promise.resolve();
            }

            // session should not be valid until it is reset
            state.active[id]._isValid = false;

            // timestamp will be used to check if maxIdleTime has been exceeded
            state.active[id].timestamp = Date.now();
            // idle connections should be prioritized
            state.idle = [state.active[id]].concat(state.idle);
            state.active.splice(id, 1);

            return this.resync(id);
        },

        resync (id) {
            if (!state.idle[id] || !state.idle[id]._properties.resolveSrv) {
                return Promise.resolve();
            }

            return state.idle[id].disconnect()
                .then(() => state.idle[id].connect());
        },

        /**
         * Start all pool connections.
         * @function
         * @name module:ConnectionPool#start
         * @returns {Promise}
         */
        start (uri) {
            if (state.idle.length + state.active.length === state.maxSize) {
                return this;
            }

            for (let i = 0; i < state.maxSize; ++i) {
                const session = new Session(Object.assign({}, uri, { pooling: state.enabled }));
                session.done = session.close;

                state.idle[i] = session;
            }

            return this;
        }
    };
}

module.exports = ConnectionPool;
