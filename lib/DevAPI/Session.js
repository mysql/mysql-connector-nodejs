/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
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

const Client = require('../Protocol/Client');
const SocketFactory = require('../SocketFactory');
const Table = require('./Table');
const authenticationManager = require('../Authentication/AuthenticationManager');
const crypto = require('crypto');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const parseUri = require('./Util/URIParser');
const schema = require('./Schema');
const sqlExecute = require('./SqlExecute');
const util = require('util');

/**
 * List of UNIX errors that might might describe an unavailable network host.
 * https://nodejs.org/docs/latest-v4.x/api/errors.html#errors_common_system_errors
 * @private
 */
const networkErrors = [
    'ECONNREFUSED',
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
    // Additional related errors.
    'ENOTFOUND',
    'EHOSTDOWN',
    'EHOSTUNREACH',
    'ENETRESET',
    'ECONNABORTED'
];

/**
 * URI object configuration.
 * @typedef {Object} URI
 * @property {string} [host] - MySQL server hostname or IP address
 * @property {number} [port] - X Protocol port number
 * @property {string} [user] - Username
 * @property {string} [password] - Password
 * @property {string} [auth] - Client authentication method (default: PLAIN)
 * @property {SocketFactory} [socketFactory] - Socket factory (not needed except for tests)
 * @property {boolean} [ssl] - Enable SSL/TLS (default: true)
 * @property {Object} [sslOptions] - tls.TLSSocket options (see https://nodejs.org/api/tls.html#tls_new_tls_tlssocket_socket_options)
 */

/**
 * Constructor for a X plugin Session
 * @param {URI} [properties]
 * @constructor
 */
function Session (properties) {
    properties = properties || {};

    if (typeof properties === 'string') {
        properties = parseUri(properties);
    }

    if (Object(properties) !== properties) {
        throw new Error('Invalid session options. Use a valid configuration object or connection URI to create a session.');
    }

    /**
     * @type {Properties}
     * @private
     */
    this._properties = Object.assign({}, {
        auth: properties.auth || ((properties.ssl || properties.socket) && 'PLAIN'),
        connection: 0,
        endpoints: [{
            host: properties.host || 'localhost',
            port: properties.port || 33060,
            socket: properties.socket
        }],
        socketFactory: new SocketFactory(),
        ssl: properties.ssl || true
    }, properties, {
        dbUser: properties.user || properties.dbUser || '',
        dbPassword: properties.password || properties.dbPassword
    });

    this._properties.endpoints.forEach(endpoint => {
        if (endpoint.port && (endpoint.port < 0 || endpoint.port > 65536)) {
            throw new Error('Port must be between 0 and 65536');
        }

        endpoint.port = endpoint.socket || endpoint.port ? endpoint.port : 33060;
        endpoint.auth = endpoint.auth || ((properties.ssl || endpoint.socket) && 'PLAIN');
    });

    _setActiveConnection.call(this, this._properties.connection);

    // TODO(rui.quelhas): these two should be grouped in a `Connection` object,
    // so that a `Session` can switch between Connections
    /**
     * @type {Client}
     * @private
     */
    this._client = {};
    this._serverCapabilities = {};
}

module.exports = Session;

/**
 * Setup connection authentication method.
 * @private
 */
function _authenticate () {
    // This is a workaround because on MySQL 5.7.x, `CapabilitiesGet` over Unix Domain Sockets reports
    // no support for `PLAIN`, while `PLAIN` is in fact supported.
    const authMechanisms = this._serverCapabilities['authentication.mechanisms'].concat('PLAIN');
    const pluginName = this._properties.auth;

    if (!pluginName) {
        return _fallbackToInsecureAuthentication.call(this);
    }

    if (authMechanisms.indexOf(pluginName) === -1) {
        return Promise.reject(new Error(`${pluginName} authentication is not supported by the server.`));
    }

    const plugin = authenticationManager.getPlugin(pluginName);

    if (!plugin) {
        return Promise.reject(new Error(`${pluginName} authentication mechanism is not supported by the client.`));
    }

    const mechanism = plugin(this._properties);

    // Delete password from properties since it is no longer needed.
    delete this._properties.dbPassword;

    return mechanism.run(this._client);
};

function _fallbackToInsecureAuthentication () {
    let fallbackPlugin = authenticationManager.getPlugin('MYSQL41');
    this._properties.auth = 'MYSQL41';

    return fallbackPlugin(this._properties)
        .run(this._client)
        .catch(err => {
            if (err.info && err.info.code !== 1045) {
                throw err;
            }

            fallbackPlugin = authenticationManager.getPlugin('SHA256_MEMORY');
            this._properties.auth = 'SHA256_MEMORY';

            return fallbackPlugin(this._properties)
                .run(this._client);
        })
        .catch(err => {
            delete this._properties.auth;

            if (err.info && err.info.code !== 1045) {
                throw err;
            }

            const message = 'Authentication failed using "MYSQL41" and "SHA256_MEMORY", check username and password or try a secure connection.';
            err.message = message;
            err.info = Object.assign({ code: 1045, message, severity: 1, sql_state: 'HY000' }, err.info);

            throw err;
        });
}

/**
 * Setup connection and capabilities.
 * @private
 */
function _createConnection (connection) {
    this._client = new Client(connection);

    const handler = (capabilities) => {
        this._properties.ssl = capabilities.tls || false;
        this._serverCapabilities = capabilities;
    };

    if (!this._properties.ssl || this._properties.socket) {
        return this._client.capabilitiesGet().then(handler);
    }

    const options = Object.assign({}, this._properties.sslOptions);

    // Try to optimistically enable SSL ("Tell, don't ask").
    return this._client
        .enableSSL(options)
        .then(() => this._client.capabilitiesGet())
        .then(handler);
};

/**
 * Build schema if it does not exist.
 * @private
 */
function _buildSchema () {
    if (!this._properties.schema) {
        return Promise.resolve();
    }

    return this.getSchema(this._properties.schema).existsInDatabase().then((exists) => {
        if (exists) {
            return Promise.resolve();
        }

        return this.createSchema(this._properties.schema);
    });
};

/**
 * Close internal stream.
 * @private
 */
function _disconnect () {
    return this._client._stream && this._client._stream.end();
}

/**
 * Delete internal-purpose properties.
 * @private
 */
function _cleanup () {
    delete this._properties.dbPassword;
    delete this._properties.socketFactory;
}

/**
 * Loop through failover addresses.
 * @private
 */
function _failover () {
    const index = this._properties.connection + 1;

    if (!this._properties.endpoints[index]) {
        _setActiveConnection.call(this, 0);

        const error = new Error('All routers failed.');
        error.errno = 4001;

        throw error;
    }

    _setActiveConnection.call(this, index);
}

/**
 * Set currently active connection address.
 * @private
 * @param {number} index - Array index of the address to use
 */
function _setActiveConnection (index) {
    this._properties.connection = index;
    // TODO(Rui): use destructuring assignment with node >= 6.0.0.
    this._properties.host = this._properties.endpoints[index].host;
    this._properties.port = this._properties.endpoints[index].port;
    this._properties.socket = this._properties.endpoints[index].socket;
    this._properties.auth = this._properties.auth || (this._properties.ssl ? 'PLAIN' : this._properties.endpoints[index].auth);
}

/**
 * Connect to the database
 * @returns {Promise<Session>} Promise resolving to myself
 */
Session.prototype.connect = function () {
    return this._properties.socketFactory
        .createSocket(this._properties)
        .then(connection => _createConnection.call(this, connection))
        .then(() => _authenticate.call(this))
        .then(() => _buildSchema.call(this))
        .then(() => {
            _cleanup.call(this);

            return this;
        })
        .catch(err => {
            if (networkErrors.indexOf(err.code) > -1) {
                _failover.call(this);

                return this.connect();
            }

            _cleanup.call(this);
            _disconnect.call(this);

            throw err;
        });
};

/**
 * Get instance of Schema object for a specific database schema
 *
 * This will always succeed, even if the schema doesn't exist. Use {@link Schema#existsInDatabase} on the returned
 * object to verify the schema exists.
 *
 * @param {string} name - Name of the schema (database)
 * @returns {module:Schema}
 */
Session.prototype.getSchema = function (name) {
    return schema(this, name);
};

/**
 * Get the default schema instance.
 * @returns {module:Schema} The default schema bound to the current session.
 */
Session.prototype.getDefaultSchema = function () {
    return this.getSchema(this._properties.schema);
};

/**
 * Get schemas
 * @returns {Promise<Array.<module:Schema>>} Promise resolving to a list of Schema instances.
 */
Session.prototype.getSchemas = function () {
    const schemas = [];
    const callback = row => row[0] && schemas.push(this.getSchema(row[0].trim()));

    return sqlExecute(this, 'SHOW DATABASES').execute(callback).then(() => schemas);
};

/**
 * Create a schema in the database.
 * @param {string} schema - Name of the Schema
 * @returns {Promise.<module:Schema>}
 */
Session.prototype.createSchema = function (schema) {
    return sqlExecute(this, `CREATE DATABASE ${Table.escapeIdentifier(schema)}`)
        .execute()
        .then(() => this.getSchema(schema));
};

/**
 * Drop a schema (without failing even if it does not exist).
 * @param {string} name - schema name
 * @returns {Promise.<boolean>} - Promise resolving to true on success
 */
Session.prototype.dropSchema = function (name) {
    return sqlExecute(this, `DROP DATABASE ${Table.escapeIdentifier(name)}`)
        .execute()
        .then(() => true)
        .catch(err => {
            // Don't fail if the schema does not exist.
            if (!err.info || err.info.code !== 1008) {
                throw err;
            }

            return true;
        });
};

/**
 * Start a transaction
 *
 * This will start a transaction on the server. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 *
 * @returns {Promise.<boolean>}
 */
Session.prototype.startTransaction = function () {
    return sqlExecute(this, 'BEGIN').execute().then(() => true);
};

/**
 * Commit a transaction
 *
 * This will commit a transaction on the server. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 *
 * @returns {Promise.<boolean>}
 */
Session.prototype.commit = function () {
    return sqlExecute(this, 'COMMIT').execute().then(() => true);
};

/**
 * Rollback a transaction
 *
 * This will rollback the current transaction. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 * Create a Schema in the database
 *
 * @returns {Promise.<boolean>}
 */
Session.prototype.rollback = function () {
    return sqlExecute(this, 'ROLLBACK').execute().then(() => true);
};

/**
 * Close the server connection.
 * @returns {Promise}
 */
Session.prototype.close = function () {
    // TODO(Rui): check for possible standard behavior when there's no connection to close.
    return this._client.close();
};

Session.prototype.inspect = function (depth) {
    const available = ['auth', 'dbUser', 'host', 'port', 'socket', 'ssl'];

    return Object.keys(this._properties).reduce((result, key) => {
        return available.indexOf(key) > -1 ? Object.assign(result, { [key]: this._properties[key] }) : result;
    }, {});
};

/**
 * Old NodeSession API.
 */

/**
 * Execute a raw SQL statement.
 * @method
 * @param {string} sql - SQL statement
 * @param {...*} [args] - query placeholder values
 * @returns {module:SqlExecute}
 * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link Session#sql|Session.sql()} instead.
 */
Session.prototype.executeSql = util.deprecate(function (sql) {
    return sqlExecute(this, sql, parseFlexibleParamList(Array.prototype.slice.call(arguments, 1)));
}, 'Session.executeSql() is deprecated since version 8.0.12 and will be removed in future versions. Use Session.sql() instead.');

/**
 * Execute a raw SQL statement.
 * @param {string} sql - SQL statement
 * @returns {module:SqlExecute}
 */
Session.prototype.sql = function (sql) {
    return sqlExecute(this, sql);
};

/**
 * Create a new transaction savepoint. If a name is not provided, one will be
 * generated using the connector-nodejs-<random-prefix> format.
 *
 * @param {string} [name] - savepoint name
 * @returns {Promise.<string>} Promise that resolves to the name of the savepoint.
 */
Session.prototype.setSavepoint = function (name) {
    name = typeof name === 'undefined' ? `connector-nodejs-${crypto.randomBytes(16).toString('hex')}` : name;
    if (typeof name !== 'string' || !name.trim().length) {
        return Promise.reject(new Error('Invalid Savepoint name.'));
    }

    return sqlExecute(this, `SAVEPOINT ${Table.escapeIdentifier(name)}`)
        .execute()
        .then(() => name);
};

/**
 * Release a transaction savepoint with the given name.
 *
 * @param {string} [name] - savepoint name
 * @returns {Promise}
 */
Session.prototype.releaseSavepoint = function (name) {
    if (typeof name !== 'string' || !name.trim().length) {
        return Promise.reject(new Error('Invalid Savepoint name.'));
    }

    return sqlExecute(this, `RELEASE SAVEPOINT ${Table.escapeIdentifier(name)}`)
        .execute();
};

/**
 * Rollback to a transaction savepoint with the given name.
 *
 * @param {string} [name] - savepoint name
 * @returns {Promise}
 */
Session.prototype.rollbackTo = function (name) {
    if (typeof name !== 'string' || !name.trim().length) {
        return Promise.reject(new Error('Invalid Savepoint name.'));
    }
    return sqlExecute(this, `ROLLBACK TO SAVEPOINT ${Table.escapeIdentifier(name)}`)
        .execute();
};
