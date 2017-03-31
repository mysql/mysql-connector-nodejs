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
function DefaultPersistenceHandler () {
    const filename = 'sessions.json';
    const state = {
        config: {
            system: {
                unix: path.resolve('/', 'etc', 'mysql', filename),
                windows: path.resolve(os.homedir(), 'PROGRAMDATA', 'MySQL', filename)
            },
            user: {
                unix: path.resolve(os.homedir(), '.mysql', filename),
                windows: path.resolve(os.homedir(), 'APPDATA', 'MySQL', filename)
            }
        },
        platform: os.platform() !== 'win32' ? 'unix' : 'windows'
    };

    /**
     * Get system-specific configuration.
     * @private
     */
    function getSystemConfig () {
        return getConfig(process.env.MYSQL_SYSTEM_CONFIG || state.config.system[state.platform]);
    }

    /**
     * Get user-specific configuration.
     * @private
     */
    function getUserConfig () {
        return getConfig(process.env.MYSQL_USER_CONFIG || state.config.user[state.platform]);

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

    return { list, load };
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
