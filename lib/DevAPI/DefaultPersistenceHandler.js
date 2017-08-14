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

const fs = require('../Adapters/fs');
const os = require('os');
const path = require('path');

/**
 * A default {@link IPersistenceHandler} implementation that uses a common
 * <code>system</code>/<code>user</code> configuration management scheme.
 * @module DefaultPersistenceHandler
 * @implements IPersistenceHandler
 */

/**
 * Create the default persistence handler.
 * @private
 * @alias module:DefaultPersistenceHandler
 * @returns {DefaultPersistenceHandler}
 */
function DefaultPersistenceHandler (state) {
    const filename = 'sessions.json';

    state = Object.assign({
        cache: {},
        platform: os.platform() !== 'win32' ? 'unix' : 'windows'
    }, state);

    /**
     * Fetch and cache the system-specific configuration.
     * @private
     */
    function getSystemConfig () {
        const cache = state.cache.system;

        if (cache) {
            return Promise.resolve(cache);
        }

        return getConfig(getSystemConfigPath()).then(config => writeToCache('system', config));
    }

    /**
     * Get system-specific configuration file path.
     * @private
     */
    function getSystemConfigPath () {
        return process.env.MYSQL_SYSTEM_CONFIG || (state.platform === 'unix'
            ? path.resolve('/', 'etc', 'mysql', filename)
            : path.join(process.env.PROGRAMDATA, 'MySQL', filename));
    }

    /**
     * Fetch and cache the user-specific configuration
     * @private
     * @returns {Promise.<Object>}
     */
    function getUserConfig () {
        const cache = state.cache.user;

        if (cache) {
            return Promise.resolve(cache);
        }

        return getConfig(getUserConfigPath()).then(config => writeToCache('user', config));
    }

    /**
     * Get user-specific configuration file path.
     * @private
     */
    function getUserConfigPath () {
        return process.env.MYSQL_USER_CONFIG || (state.platform === 'unix'
            ? path.resolve(os.homedir(), '.mysql', filename)
            : path.join(process.env.APPDATA, 'MySQL', filename));
    }

    /**
     * Write data to internal cache.
     * @private
     * @param {type} type - configuration type (`user` or `system`)
     * @param {Object} config
     */
    function writeToCache (type, config) {
        state.cache[type] = config;

        return state.cache[type];
    }

    /**
     * Get all the available persistent session configurations indexed by by their type.
     * @private
     * @returns {Promise.<Object>}
     */
    function getConfigByType () {
        return getSystemConfig().then(system => {
            return getUserConfig().then(user => ({ system, user }));
        });
    }

    /**
     * Check if a persisent session exists in the configuration files.
     * @function
     * @name module:DefaultPersistenceHandler#exists
     * @param {string} name - session name
     * @returns {Promise.<boolean>}
     */
    function exists (name) {
        return getConfigByType().then(sessions => {
            const session = Object.assign({}, sessions.system[name], sessions.user[name]);

            return Object.keys(session).length > 0;
        });
    }

    /**
     * Remove a persistent from the user-specific configuration file.
     * @function
     * @name module:DefaultPersistenceHandler#delete
     * @param {string} name - session name
     * @returns {Promise}
     */
    function remove (name) {
        return getUserConfig().then(sessions => {
            const discarded = Object.assign({}, sessions);
            delete discarded[name];

            return fs.writeFile(getUserConfigPath(), JSON.stringify(discarded))
                .then(() => {
                    writeToCache('system', discarded);
                    writeToCache('user', discarded);
                });
        });
    }

    /**
     * Get the list of names of all the available persistent session configurations.
     * @function
     * @name module:DefaultPersistenceHandler#list
     * @throws {Error} When some configuration has an invalid format.
     * @returns {Promise.<string[]>}
     */
    function list () {
        return getConfigByType().then(sessions => Object.keys(sessions).reduce((outer, type) => {
            return outer.concat(Object.keys(sessions[type]).reduce((inner, name) => {
                if (outer.indexOf(name) > -1) {
                    return inner;
                }

                return inner.concat(name);
            }, []));
        }, []));
    }

    /**
     * Load persisted session details.
     * @function
     * @name module:DefaultPersistenceHandler#load
     * @param {string} name - session name
     * @throws {Error} When there are no details available for the given session.
     * @returns {Promise.<Object>}
     */
    function load (name) {
        return getConfigByType().then(sessions => {
            if (!sessions.system[name] && !sessions.user[name]) {
                throw new Error('No details are available for the given session');
            }

            return Object.assign({}, sessions.system[name], sessions.user[name]);
        });
    }

    /**
     * Store details of a persistent session.
     * @function
     * @name module:DefaultPersistentHandler#save
     * @param {string} name - session name
     * @param {Object} data
     * @returns {Promise.<Object>}
     */
    function save (name, data) {
        return getUserConfig()
            .then(config => {
                const overrides = Object.assign({}, config[name], data);
                const rw = Object.assign({}, config, { [name]: overrides });

                return fs.writeFile(getUserConfigPath(), JSON.stringify(rw))
                    .then(() => writeToCache('user', rw));
            });
    }

    return { delete: remove, exists, list, load, save };
};

/**
 * Load configuration object from file.
 * @private
 * @param {string} configFile - path of the configuration file
 * @returns {Promise.<Object>}
 */
function getConfig (configFile) {
    return fs.readFile(configFile).then(JSON.parse).catch(errorHandler({}));
}

/**
 * Generate an error handler with a fallback result.
 * @private
 * @param {*} fallback
 * @returns {Function}
 */
function errorHandler (fallback) {
    return function (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        return fallback;
    };
}

module.exports = DefaultPersistenceHandler;
