/*
 * Copyright (c) 2015-2017, Oracle and/or its affiliates. All rights reserved.
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

const Session = require('./lib/DevAPI/Session');
const Expressions = require('./lib/Expressions');
const Authentication = require('./lib/Authentication');
const configManager = require('./lib/DevAPI/SessionConfigManager');
const parseUri = require('./lib/DevAPI/Util/URIParser');

/**
 * @module mysqlx
 */

const config = configManager();

/**
 * Create a session instance.
 * @private
 * @param {string|URI} configuration - session base reference
 * @throws {Error} When the session base reference is not valid.
 * @returns {Promise.<Session>}
 */
function createSession (configuration) {
    let session;

    try {
        session = new Session(configuration);
    } catch (err) {
        return Promise.reject(err);
    }

    return session.connect();
}

/**
 * Load a new session.
 * @private
 * @param {string|URI|module:SessionConfig} session
 * @see {@link module:SessionConfig|SessionConfig}
 * @param {Object} overrides - session properties to override
 * @returns {Promise.<Session>}
 */
function loadSession (properties, overrides) {
    if (typeof properties.getUri !== 'function') {
        return createSession(properties);
    }

    const base = parseUri(properties.getUri());
    const configuration = Object.assign({}, base, overrides, {
        endpoints: [{
            host: overrides.host || base.endpoints[0].host,
            port: overrides.port || base.endpoints[0].port,
            socket: overrides.socket || base.endpoints[0].socket
        }]
    });

    return createSession(configuration);
}

/**
 * Load a new or existing session.
 * @param {string|URI|SessionConfig} properties - session properties
 * @see {@link module:SessionConfig|SessionConfig}
 * @param {string} [password] - user password
 * @returns {Promise.<Session>}
 */
exports.getSession = function (properties, password) {
    let configuration = {};

    try {
        // properties is a JSON string
        configuration = JSON.parse(properties);
    } catch (err) {
        if (err.name !== 'SyntaxError') {
            return Promise.reject(err);
        }

        // properties is an URI, an object or a dictionary
        configuration = properties;
    }

    password = password || configuration.dbPassword;

    if (!configuration.sessionName) {
        return loadSession(configuration, { dbPassword: password });
    }

    const base = Object.assign({}, configuration, { dbPassword: password });
    delete base.sessionName;

    return config.get(configuration.sessionName)
        .then(instance => loadSession(instance, base));
};

/**
 * Manage persisted session configurations.
 * @type {SessionConfigManager}
 * @const
 * @see {@link module:SessionConfigManager|SessionConfigManager}
 */
exports.config = config;

/**
 * Parse an expression into parse tree
 * @param {String} exp Expression
 * @eturn {Expression}
 */
exports.expr = function (exp) {
    return Expressions.parse(exp);
};

/**
 * Get available auth methods.
 *
 * In most cases this will return <pre>[ 'PLAIN', 'MYSQL41' ]</pre>
 * @return {Array.<String>}
 */
exports.getAuthMethods = function () {
    return Authentication.getNames();
};

/**
 * Get the version number
 *
 * This is  shortcut for reading package.json/version
 *
 * @return {String}
 */
exports.getVersion = function () {
    return require('./package').version;
};
