/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

const Auth = require('../Authentication');
const Client = require('../Protocol/Client');
// FIXME(Rui): fix the authentication method constructor nonsense.
const MySQL41Auth = require('../Authentication/MySQL41Auth');
const NullAuth = require('../Authentication/NullAuth');
const PlainAuth = require('../Authentication/PlainAuth');
const SocketFactory = require('../SocketFactory');
const Statement = require('./Statement');
const Table = require('./Table');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const parseUri = require('./Util/URIParser');
const schema = require('./Schema');
const stmtExecute = require('./StmtExecute');
const uuid = require('./Util/UUID');

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
 * A callback which produces IDs for documents
 * @callback IdGenerator
 * @return {string}
 */

/**
 * URI object
 * @typedef {Object} URI
 * @property {string} host Hostname to connect to
 * @property {number} port Port number
 * @property {string} dbUser Username
 * @property {string} dbPassword Password
 * @property {string} auth Name of an authentication mehod to use (default: PLAIN)
 * @property {SocketFactory} socketFactory A factory which can creaes socket, usually not needed outside tests
 * @property {bool} ssl Enable SSL, defaults to true
 * @property {object} sslOption options passed to tls.TLSSocket constructor, see https://nodejs.org/api/tls.html#tls_new_tls_tlssocket_socket_options
 * @property {IdGenerator} idGenerator Generator to produce document ids
 */

/**
 * Constructor for a X plugin Session
 * @abstract
 * @param {URI} properties
 * @constructor
 */
function Session (properties) {
    if (typeof properties === 'string') {
        properties = parseUri(properties);
    }

    if (Object(properties) !== properties) {
        throw new Error('The properties argument should be an object');
    }

    /**
     * @type {Properties}
     * @private
     */
    this._properties = Object.assign({}, {
        connection: 0,
        endpoints: [{
            host: properties.host || 'localhost',
            port: properties.port || 33060,
            socket: properties.socket
        }],
        socketFactory: new SocketFactory(),
        ssl: properties.ssl || true
    }, properties, {
        dbUser: properties.user || properties.dbUser,
        dbPassword: properties.password || properties.dbPassword
    });

    this._properties.endpoints.forEach(endpoint => {
        if (endpoint.port && (endpoint.port < 0 || endpoint.port > 65536)) {
            throw new Error('Port must be between 0 and 65536');
        }

        endpoint.port = endpoint.socket || endpoint.port ? endpoint.port : 33060;
        endpoint.auth = properties.ssl || endpoint.socket ? 'PLAIN' : 'MYSQL41';
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

    this.idGenerator = typeof properties.idGenerator === 'function' ? properties.idGenerator : uuid();
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

    if (authMechanisms.indexOf(this._properties.auth) === -1) {
        return Promise.reject(new Error('Authentication mechanism is not supported by the server'));
    }

    const AuthMethod = Auth.get(this._properties.auth);
    const auth = new AuthMethod(this._properties);

    // Delete password from properties since it is no longer needed.
    delete this._properties.dbPassword;

    return auth.run(this._client);
};

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
 * @returns {Schema}
 */
Session.prototype.getSchema = function (name) {
    return schema(this, name);
};

/**
 * An object with a list of schema names as key and schema objects as value
 *
 * @typedef {object} SchemaList
 */

/**
 * Get schemas
 *
 * @returns {Promise.<SchemaList>} Promise resolving to an object of Schema name <-> Schema object pairs
 */
Session.prototype.getSchemas = function () {
    const schemas = {};
    const callback = row => { schemas[row[0]] = this.getSchema(row[0]); };

    return stmtExecute(this, 'SHOW DATABASES').execute(callback).then(() => schemas);
};

/**
 * Create a Schema in the database
 *
 * @param {string} schema - Name of the Schema
 * @returns {Promise.<Schema>}
 */
Session.prototype.createSchema = function (schema) {
    return stmtExecute(this, `CREATE DATABASE ${Table.escapeIdentifier(schema)}`)
        .execute()
        .then(() => this.getSchema(schema));
};

/**
 * Drop a schema (without failing even if the view does not exist)..
 * @param {string} name - schema name
 * @returns {Promise.<boolean>} - Promise resolving to true on success
 */
Session.prototype.dropSchema = function (name) {
    return stmtExecute(this, `DROP DATABASE ${Table.escapeIdentifier(name)}`)
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
 * @returns {Promise.<bool>}
 */
Session.prototype.startTransaction = function () {
    return stmtExecute(this, 'BEGIN').execute().then(() => true);
};

/**
 * Commit a transaction
 *
 * This will commit a transaction on the server. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 *
 * @returns {Promise.<bool>}
 */
Session.prototype.commit = function () {
    return stmtExecute(this, 'COMMIT').execute().then(() => true);
};

/**
 * Rollback a transaction
 *
 * This will rollback the current transaction. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 * Create a Schema in the database
 *
 * @returns {Promise.<bool>}
 */
Session.prototype.rollback = function () {
    return stmtExecute(this, 'ROLLBACK').execute().then(() => true);
};

/**
 * Close the connection
 */
Session.prototype.close = function () {
    this._client.close();
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
 * Row Callback
 * @callback SQLExecutor~RowCallback
 * @param {array} row
 */

/**
 * Meta Data from SQL
 * @typedef {Object} SQLExecutor~Meta
 * @property {Number} type Type of the field
 * @property {String} name Name of the field
 * @property {String} original_name Original name of the field (i.e. if aliased)
 * @property {String} table Name of the table
 * @property {String} original_table Original name of the table (i.e. if aliased)
 * @property {String} schema Name of the schema of the table
 * @property {String} catalog Currently always 'def'
 * @property {Number} collation
 * @property {Number} fractional_digits Number of fractional digits
 * @property {Number} length Length of the field
 */

/**
 * Meta Callback
 * @callback SQLExecutor~MetaCallback
 * @param {Column} meta data
 */

/**
 * Object holding row and meta data callbacks
 * @typedef {Object} SQLExecutor~RowMetaCallbackObject
 * @property {SQLExecutor~MetaCallback} meta callback for meta data, called for each result set
 * @property {SQLExecutor~RowCallback} row callback called for each row
 */

/**
 * @constructor
 */
function SQLExecutor () {
    // For documentation
}

/**
 * Execute SQL from {@link Session#executeSql}
 * @param {(SQLExecutor~RowMetaCallbackObject|SQLExecutor~RowCallback)} [callback] Either a callback called on each row or an object containing meta and row callbacks
 * @param {SQLExecutor~MetaCallback} [metacb] A callback called on meta data
 * @returns {Promise.<Result>}
 */
SQLExecutor.prototype.execute = function (callback, metacb) {
    // For documentation, see executeSql below
};

/**
 * Execute SQL query
 *
 * Note: This doesn't follow the DevAPI but adds an extra execute() function to define callbacks for rows and meta data
 * before each result set the meta cb is called, then for each row the rowcb. One can either provide callbacks or an
 * object containing a row and meta method
 *
 * <pre>session.executeSql("SELECT * FROM t")
 *     .execute(function (row) { process single row  })
 *     .then( function (notices) { process notices });</pre>
 *
 * or
 *
 * <pre>session.executeSql("SELECT * FROM t")
 *     .execute({
 *         row: function (row) { process single row },
 *         meta: function (meta) { process meta data }
 *      })
 *     .then( function (notices) { process notices });</pre>
 *
 * @param {string} sql SQL string
 * @returns {SQLExecutor}
 */
Session.prototype.executeSql = function (sql) {
    return stmtExecute(this, sql, parseFlexibleParamList(Array.prototype.slice.call(arguments, 1)));
};

/**
 * Alias for {@link Session#executeSql}.
 * @see {@link Session#executeSql}
 */
Session.prototype.sql = function (sql) {
    return this.executeSql(sql);
};

/**
 * Create a new transaction savepoint. If a name is not provided, one will be
 * generated using the connector-nodejs-<UUID> format.
 *
 * @param {string} [name] - savepoint name
 * @returns {Promise.<string>} Promise that resolves to the name of the savepoint.
 */
Session.prototype.setSavepoint = function (name) {
    name = typeof name === 'undefined' ? `connector-nodejs-${uuid()()}` : name;
    if (typeof name !== 'string' || !name.trim().length) {
        return Promise.reject(new Error('Invalid Savepoint name.'));
    }

    return stmtExecute(this, `SAVEPOINT ${Table.escapeIdentifier(name)}`)
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

    return stmtExecute(this, `RELEASE SAVEPOINT ${Table.escapeIdentifier(name)}`)
        .execute();
}

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
    return stmtExecute(this, `ROLLBACK TO SAVEPOINT ${Table.escapeIdentifier(name)}`)
        .execute();
}
