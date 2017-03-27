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

const sessionConfig = require('./SessionConfig');
const persistenceHandler = require('./DefaultPersistenceHandler');
const parseUri = require('./Util/URIParser');

/**
 * Session configuration management module.
 * @module SessionConfigManager
 */

/**
 * Create a session configuration manager.
 * @private
 * @alias module:SessionConfigManager
 * @returns {SessionConfigManager}
 */
function SessionConfigManager () {
    const state = { persistenceHandler: persistenceHandler() };

    /**
     * Build configuration object with a password.
     * @private
     * @param {string} name - session name
     * @returns {SessionConfig} The session configuration object.
     */
    function buildConfigWithPassword (name) {
        return buildConfigWithoutPassword(name)
            .then(config => {
                const uri = config.getUri();
                const obj = parseUri(uri);

                if (!obj.dbUser) {
                    return config;
                }

                const address = obj.endpoints[0];

                return state.passwordHandler
                    .load(obj.dbUser, `${address.host}:${address.port || 33060}`)
                    .then(password => buildConfig(name, assembleUriWithPassword(uri, password), obj.appdata));
            });
    }

    /**
     * Build configuration object without a password.
     * @private
     * @param {string} name - session name
     * @returns {SessionConfig} The session configuration object.
     */
    function buildConfigWithoutPassword (name) {
        return state.persistenceHandler
            .load(name)
            .then(obj => buildConfig(name, obj.uri, obj.appdata));
    }

    /**
     * Build a configuration object including application-specific data.
     * @param {string} name - session name
     * @param {string} uri - URI string
     * @param {Object} appdata - dictionary with application-specific data
     */
    function buildConfig (name, uri, appdata) {
        const config = sessionConfig(name, uri);

        Object.keys(appdata || {}).forEach(key => config.setAppData(key, appdata[key]));

        return config;
    }

    /**
     * Append password to a passwordless URI string.
     * @private
     * @param {string} uri - session URI
     * @param {string} password - user password
     * @returns {string} The URI with filled with the proper password.
     */
    function assembleUriWithPassword (uri, password) {
        const data = parseUri(uri);
        const lhsIndex = uri.indexOf(data.dbUser) + data.dbUser.length;
        const rhsIndex = uri.length;

        return uri
            .substring(0, lhsIndex)
            .concat(`:${password}`)
            .concat(uri.substring(lhsIndex, rhsIndex));
    }

    /** Public API */
    return {

        /**
         * Get persisted details of a given session.
         * @function
         * @name module:SessionConfigManager#get
         * @param {string} name - session name
         * @returns {Promise.<SessionConfig>}
         * @see {@link module:SessionConfig|SessionConfig}
         */
        get (name) {
            if (!state.persistenceHandler) {
                return Promise.reject(new Error('No IPersistenceHandler implementation available'));
            }

            if (state.passwordHandler) {
                return buildConfigWithPassword(name);
            }

            return buildConfigWithoutPassword(name);
        },

        /**
         * @interface IPersistenceHandler
         * @global
         */

         /**
          * Load persisted session details.
          * @function
          * @name IPersistenceHandler#load
          * @param {string} name - session name
          * @returns {Promise.<Object>}
          */

        /**
         * Set a custom persistence hander.
         * @function
         * @name module:SessionConfigManager#setPersistenceHandler
         * @param {IPersistenceHandler} handler - persistence plugin
         * @returns {SessionConfigManager}
         */
        setPersistenceHandler (handler) {
            state.persistenceHandler = handler;

            return this;
        },

        /**
         * @interface IPasswordHandler
         * @global
         */

        /**
         * Load password from an external source.
         * @function
         * @name IPasswordHandler#load
         * @param {string} key - username
         * @param {string} service - <host>:<port>
         * @returns {Promise.<string>}
         */

        /**
         * Set a custom password handler.
         * @function
         * @name module:SessionConfigManager#setPasswordHandler
         * @param {IPasswordHandler} handler
         * @returns {SessionConfigManager}
         * @see {@link PasswordHandler}
         */
        setPasswordHandler (handler) {
            state.passwordHandler = handler;

            return this;
        }
    };
};

module.exports = SessionConfigManager;
