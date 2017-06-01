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
const stringifyUri = require('./Util/stringifyUri');

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
     * Build a session configuration instance.
     * @private
     * @param {string} name - session name
     * @param {Object} raw - session parameters
     * @returns {SessionConfig} The session configuration instance.
     */
    function buildConfig (name, raw) {
        const config = sessionConfig(name, raw.uri, raw.appdata);

        if (!state.passwordHandler) {
            return config;
        }

        return lookupPassword(config).then(dbPassword => {
            if (!dbPassword) {
                return config;
            }

            return config.setUri(stringifyUri(Object.assign({}, parseUri(config.getUri()), { dbPassword })));
        });
    }

    /**
     * Add hook to handle events for saving a given session configuration instance.
     * @private
     * @param {SessionConfig} config
     * @returns {SessionConfig}
     */
    function addSaveHook (config) {
        config.removeAllListeners();
        config.on('save', next => next(saveConfig(config)));

        return config;
    }

    /**
     * Lookup for a persistent session password.
     * @private
     * @param {SessionConfig} config - session configuration instance
     * @returns {Promise.<string>}
     */
    function lookupPassword (config) {
        const segments = parseUri(config.getUri());

        const key = segments.dbUser;
        const endpoint = segments.endpoints[0];
        const service = endpoint.socket || `${endpoint.host}:${endpoint.port || 33060}`;
        const isPasswordlessUser = typeof segments.dbPassword === 'string' && !segments.dbPassword.length;

        if (!key || !service || isPasswordlessUser) {
            return Promise.resolve();
        }

        return state.passwordHandler.load(key, service);
    }

    /**
     * Check if an object is an instance of SessionConfig (duck-typing).
     * @private
     * @param {Object} obj - an object
     * @returns {boolean}
     */
    function isSessionConfig (obj) {
        return typeof obj.getName === 'function' && typeof obj.getUri === 'function';
    }

    /**
     * Save a unified session configuration instance.
     * @private
     * @param {SessionConfig} config - session configuration instance
     * @returns {Promise.<SessionConfig>}
     */
    function saveConfig (config) {
        if (!state.passwordHandler) {
            return saveConfigWithHandler(config);
        }

        return saveConfigWithHandler(config)
            .then(() => savePasswordWithHandler(config));
    }

    /**
     * Parse JSON string or fallback to the input value on parsing errors.
     * @private
     * @param {Object|string} input
     * @returns {Object} An object containg an `output` property.
     */
    function parseJSONOrFallback (input) {
        try {
            return { output: JSON.parse(input) };
        } catch (err) {
            return { output: input };
        }
    }

    /**
     * Use the persistence handler to save a passwordless session configuration instance.
     * @private
     * @param {SessionConfig} config - session configuration instance
     * @returns {Promise.<SessionConfig>}
     */
    function saveConfigWithHandler (config) {
        // strip password
        const segments = parseUri(config.getUri());
        delete segments.dbPassword;

        return state.persistenceHandler
            .save(config.getName(), { uri: stringifyUri(segments), appdata: config.toObject().appdata })
            .then(() => config);
    }

    /**
     * Save the password using the password handler.
     * @private
     * @param {SessionConfig} config
     * @returns {Promise.<SessionConfig>}
     */
    function savePasswordWithHandler (config) {
        const segments = parseUri(config.getUri());

        const key = segments.dbUser;
        const endpoint = segments.endpoints[0];
        const service = endpoint.socket || `${endpoint.host}:${endpoint.port || 33060}`;
        const password = segments.dbPassword;

        if (!key || !service || !password) {
            return Promise.resolve(config);
        }

        return state.passwordHandler
            .save(key, service, password)
            .then(() => config);
    }

    /**
     * Merge uknown URI paramaters with additional appdata.
     * @private
     * @param {Object} obj
     * @returns {Object} The full appdata object.
     */
    function mergeAppData (obj) {
        const known = [
            'dbUser',
            'dbPassword',
            'host',
            'port',
            'schema',
            'socket',
            'ssl',
            'sslOptions'
        ];

        return Object.keys(obj).reduce((result, key) => {
            if (known.indexOf(key) > -1) {
                return result;
            }

            return Object.assign(result, { [key]: obj[key] });
        }, Object.assign({}, obj.appdata));
    }

    return {

        /**
         * Get persistent session instance.
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

            return state.persistenceHandler
                .load(name)
                .then(raw => buildConfig(name, raw))
                .then(config => addSaveHook(config));
        },

        /**
         * Delete an existing persistent session.
         * @function
         * @name module:SessionConfigManager#delete
         * @param {string} session - session name
         * @returns {Promise.<boolean>}
         */
        delete (session) {
            if (!state.persistenceHandler) {
                return Promise.reject(new Error('No IPersistenceHandler implementation available'));
            }

            return state.persistenceHandler
                .exists(session)
                .then(status => state.persistenceHandler.delete(session).then(() => status));
        },

        /**
         * Get a list of names of the available persistent sessions.
         * @function
         * @name module:SessionConfigManager#list
         * @returns {Promise.<string[]>}
         */
        list () {
            if (!state.persistenceHandler) {
                return Promise.reject(new Error('No IPersistenceHandler implementation available'));
            }

            return state.persistenceHandler.list();
        },

        /**
         * Save the details of a persistent session.
         * @function
         * @name module:SessionConfigManager#save
         * @param {SessionConfig|string} session - session configuration instance or just the session name
         * @param {Object} [input] - session details
         * @param {Object} [appdata] - application-specific parameters
         */
        save (session, input, appdata) {
            let config;

            if (!state.persistenceHandler) {
                return Promise.reject(new Error('No IPersistenceHandler implementation available'));
            }

            input = parseJSONOrFallback(input).output;
            appdata = parseJSONOrFallback(appdata).output;

            if (isSessionConfig(session)) {
                config = session;
            } else if (typeof input === 'string') {
                config = sessionConfig(session, input, appdata);
            } else {
                config = sessionConfig(session, stringifyUri(input), mergeAppData(input));
            }

            return saveConfig(config).then(config => addSaveHook(config));
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
