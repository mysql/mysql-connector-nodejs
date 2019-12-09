/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates. All rights reserved.
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
const Table = require('./Table');
const authenticationManager = require('../Authentication/AuthenticationManager');
const crypto = require('crypto');
const multihost = require('./Util/multihost');
const net = require('net');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const parseUri = require('./Util/URIParser');
const schema = require('./Schema');
const sqlExecute = require('./SqlExecute');
const srv = require('./Util/srv');
const tls = require('./Util/tls');
const util = require('util');

const MULTIHOST_RETRY = 20000; // ms

/**
 * URI object configuration.
 * @typedef {Object} URI
 * @property {string} [host] - MySQL server hostname or IP address
 * @property {number} [port] - X Protocol port number
 * @property {string} [user] - Username
 * @property {string} [password] - Password
 * @property {string} [auth] - Client authentication method (default: PLAIN)
 * @property {boolean} [ssl] - Enable SSL/TLS (default: true)
 * @property {Object} [sslOptions] Deprecated since 8.0.19. Use {@link TLSOptions|tls} instead.
 * @property {TLSOptions} [tls] - TLS-related options
 * @property {number} [connectTimeout] - Server initial connection timeout
 * @property {Object} [connectionAttributes] - Connection attributes
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

    srv.validateOptions(properties);

    properties.tls = tls.validateOptions(properties);

    /**
     * @type {Properties}
     * @private
     */
    this._properties = Object.assign({}, {
        auth: properties.auth || ((properties.tls.enabled || properties.socket) && 'PLAIN'),
        attempts: 0,
        connection: 0,
        connectionAttributes: properties.connectionAttributes || {},
        connectTimeout: 10000,
        endpoints: [{
            host: properties.host || 'localhost',
            port: properties.port || 33060,
            socket: properties.socket
        }],
        pooling: properties.pooling || false,
        resolveSrv: properties.resolveSrv || false,
        ssl: properties.tls.enabled
    }, properties, {
        dbUser: properties.user || properties.dbUser || ''
    });

    this._properties.user = this._properties.dbUser;
    this._requestedHost = this._properties.endpoints[0].host;

    // Obfuscate password in dumps. Revisit this later if needed.
    Object.defineProperty(this._properties, 'dbPassword', {
        get: function () {
            return properties.password || properties.dbPassword;
        }
    });

    this._properties.endpoints.forEach(endpoint => {
        if (endpoint.port && (endpoint.port < 0 || endpoint.port > 65536)) {
            throw new Error('Port must be between 0 and 65536');
        }

        endpoint.port = endpoint.socket || endpoint.port ? endpoint.port : 33060;
        endpoint.auth = endpoint.auth || ((properties.tls.enabled || endpoint.socket) && 'PLAIN');
    });

    _setActiveConnection.call(this, this._properties.endpoints[0]);

    this._available = this._properties.endpoints;
    this._unavailable = [];

    // TODO(Rui): these should part of a `Connection` object,
    // so that a `Session` can switch between Connections
    /**
     * @type {Client}
     * @private
     */
    this._isValid = false;
    this._isOpen = false;
    this._client = {};
    this._serverCapabilities = {};

    this._canPrepareStatements = true;
    this._statements = [];
}

module.exports = Session;

function _setActiveConnection (endpoint) {
    this._properties.host = endpoint.host;
    this._properties.port = endpoint.port;
    this._properties.socket = endpoint.socket;
    this._properties.auth = this._properties.auth || (this._properties.ssl ? 'PLAIN' : endpoint.auth);
}

/**
 * Send connection attributes
 * @private
 */
function _sendConnectionAttributes () {
    let attribs = this._properties.connectionAttributes;

    if (!attribs) {
        return;
    }

    const isObject = typeof attribs === 'object' && !Array.isArray(attribs);
    const isBoolean = typeof attribs === 'boolean';

    if (!isObject && !isBoolean) {
        throw new Error('The value of "connection-attributes" must be either a boolean or a list of key-value pairs.');
    }

    const usesInvalidConvention = Object.keys(attribs).some(a => a.charAt(0) === '_');

    if (usesInvalidConvention) {
        return Promise.reject(new Error('Key names in "connection-attributes" cannot start with "_".'));
    }

    return this._client.sendConnectionAttributes(attribs);
}

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
    this._client = new Client(connection, this);
    // TODO(Rui): this is a hack to check if the connection is usable.
    // Should change when connections are decoupled from sessions.
    this._isValid = true;

    const handler = (capabilities) => {
        this._properties.tls.enabled = capabilities.tls || false;
        this._properties.ssl = this._properties.tls.enabled;
        this._serverCapabilities = capabilities;
    };

    if (!this._properties.tls.enabled || this._properties.socket) {
        return this._client.capabilitiesGet().then(handler);
    }

    const options = Object.assign({}, this._properties.tls);

    // Try to optimistically enable SSL ("Tell, don't ask").
    return this._client
        .enableTLS(options)
        .then(() => this._client.capabilitiesGet())
        .then(handler);
};

/**
 * Close internal stream.
 * @private
 */
function _disconnect () {
    return this._client._stream && this._client._stream.end();
}

/**
 * Loop through failover addresses.
 * @private
 */
function _failover (err) {
    // connection should now become unavailable
    this._unavailable.push(Object.assign({}, this._available[0], { lastCheck: Date.now() }));
    this._available = this._available.slice(1, this._available.length);

    // single host case, we should return back the error immediatelly
    if (this._available.length + this._unavailable.length === 1) {
        _disconnect.call(this);

        return Promise.reject(err);
    }

    // multihost case
    if (!this._available.length) {
        _disconnect.call(this);

        const error = new Error(`Unable to connect to any of the target hosts.`);
        error.errno = 4001;

        return Promise.reject(error);
    }

    _setActiveConnection.call(this, this._available[0]);

    return createSocket.call(this);
}

/**
 * @private
 */
function connect_ (socket) {
    return _createConnection.call(this, socket)
        .then(() => {
            return Promise.all([
                _sendConnectionAttributes.call(this),
                _authenticate.call(this)
            ]);
        })
        .then(() => {
            this._isOpen = true;
            return this;
        })
        .catch(err => _failover.call(this, err));
}

function createSocket () {
    const options = !this._properties.socket ? this._properties : { path: this._properties.socket };
    const timeout = parseFloat(this._properties.connectTimeout);

    this._properties.attempts += 1;

    return new Promise((resolve, reject) => {
        if (!Number.isInteger(timeout) || timeout < 0) {
            return reject(new Error('The connection timeout value must be a positive integer (including 0).'));
        }

        const socket = net.connect(options);
        socket.setTimeout(timeout);

        socket.on('connect', () => {
            connect_.call(this, socket)
                .then(resolve)
                .then(() => {
                    // disable the socket timeout after a connection was successfully established
                    socket.setTimeout(0);

                    this._properties.attempts = 0;
                })
                .catch(reject);
        });

        socket.on('timeout', () => {
            // should not update _isOpen since the socket is still open
            this._isValid = false;

            const err = new Error();
            err.code = 'ETIMEDOUT';

            // if there no other targets speficied
            if (this._available.length + this._unavailable.length === 1) {
                err.message = `Connection attempt to the server was aborted. Timeout of ${timeout} ms was exceeded.`;
                return reject(err);
            }

            // if this is the last available target
            if (this._available.length === 1) {
                err.message = `All server connection attempts were aborted. Timeout of ${timeout} ms was exceeded for each selected server.`;
                return reject(err);
            }

            _failover.call(this, err).then(resolve).catch(reject);
        });

        let networkError = new Error('The server has gone away');

        socket.once('error', err => {
            // a 'close' event will be fired immediately after
            networkError = err;
        });

        socket.once('end', () => {
            this._isValid = false;
            this._isOpen = false;
        });

        socket.once('close', hasError => {
            // we should only failover during the connection phase
            if (!hasError || this._isOpen || this._isValid) {
                return;
            }

            _failover.call(this, networkError).then(resolve).catch(reject);
        });
    });
}

/**
 * Connect to the database
 * @private
 * @returns {Promise<Session>} Promise resolving to the current Session instance.
 */
Session.prototype.connect = function () {
    const handler = endpoints => {
        // update the list of available endpoints
        this._available = endpoints;

        _setActiveConnection.call(this, endpoints[0]);

        return createSocket.call(this);
    };

    if (!this._properties.resolveSrv) {
        const now = Date.now();

        this._available = this._available.concat(this._unavailable.filter(e => now - e.lastCheck >= MULTIHOST_RETRY));
        this._unavailable = this._unavailable.filter(e => now - e.lastCheck < MULTIHOST_RETRY);

        return handler(multihost.getSortedAddressList(this._available));
    }

    return srv.getSortedAddressList(this._requestedHost)
        .then(endpoints => {
            return handler(endpoints.map(address => ({ host: address.name, port: address.port })));
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
 * @returns {Array.<module:Schema>} Promise resolving to a list of Schema instances.
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
 * Reset the active session.
 * @private
 * @returns {Promise}
 */
Session.prototype.reset = function () {
    return this._client.sessionReset().then(() => {
        this._statements = [];
        this._isValid = true;
        this._isOpen = true;
        return this;
    });
};

/**
 * Close the active session.
 * @private
 * @returns {Promise}
 */
Session.prototype.close = function () {
    // TODO(Rui): this is a hack to check if the connection is usable.
    // Should change when connections are decoupled from sessions.
    if (!this._isOpen) {
        return Promise.resolve();
    }

    this._statements = [];
    this._isOpen = false;
    this._isValid = false;

    return this._client.sessionClose();
};

/**
 * Close the server connection.
 * @private
 * @returns a promise.
 */
Session.prototype.disconnect = function () {
    // TODO(Rui): this is a hack to check if the connection is usable.
    // Should change when connections are decoupled from sessions.
    if (!this._isOpen) {
        return Promise.resolve();
    }

    this._statements = [];
    this._isOpen = false;
    this._isValid = false;

    return this._client.connectionClose();
};

Session.prototype.inspect = function (depth) {
    const available = ['auth', 'dbUser', 'host', 'pooling', 'port', 'schema', 'socket', 'ssl', 'user'];

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
