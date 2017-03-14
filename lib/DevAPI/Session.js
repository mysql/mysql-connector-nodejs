/*
 * Copyright (c) 2015, 2016, 2017, Oracle and/or its affiliates. All rights reserved.
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

const Auth = require('../Authentication');
const Client = require('../Protocol/Client');
const Column = require('./Column');
// FIXME(Rui): fix the authentication method constructor nonsense.
const MySQL41Auth = require('../Authentication/MySQL41Auth');
const NullAuth = require('../Authentication/NullAuth');
const PlainAuth = require('../Authentication/PlainAuth');
const Result = require('./Result');
const Schema = require('./Schema.js');
const SocketFactory = require('../SocketFactory');
const Statement = require('./Statement');
const Table = require('./Table');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const parseUri = require('./Util/parseUri');
const crypto = require('crypto');

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
 * @property {string} authMethod Name of an authentication mehod to use (default: MySQL41)
 * @property {SocketFactory} socketFactory A factory which can creaes socket, usually not needed outside tests
 * @property {bool} ssl Enable SSL, defaults to false
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
        endpoints: [{
            host: properties.host || 'localhost',
            port: properties.port || 33060
        }],
        socketFactory: new SocketFactory()
    }, properties);

    this._properties.endpoints.forEach(endpoint => {
        if (endpoint.port && (endpoint.port < 0 || endpoint.port > 65536)) {
            throw new Error('Port must be between 0 and 65536');
        }

        endpoint.port = endpoint.port || 33060;
    });

    this._properties.host = this._properties.endpoints[0].host;
    this._properties.port = this._properties.endpoints[0].port;

    // TODO(rui.quelhas): these two should be grouped in a `Connection` object,
    // so that a `Session` can switch between Connections
    /**
     * @type {Client}
     * @private
     */
    this._client = {};
    this._serverCapabilities = {};

    if (typeof properties.idGenerator === 'function') {
        this.idGenerator = properties.idGenerator;
    }
}

module.exports = Session;

/**
 * Setup connection authentication method.
 */
function _authenticate () {
    const AuthMethod = Auth.get(this._properties.authMethod || 'MYSQL41');
    const auth = new AuthMethod(this._properties);

    // Delete password from properties since it is no longer needed.
    delete this._properties.dbPassword;

    return auth.run(this._client);
};

/**
 * Setup connection and capabilities.
 */
function _createConnection (connection) {
    this._client = new Client(connection);

    const handler = (capabilities) => {
        this._serverCapabilities = capabilities;
    };

    if (!this._properties.ssl) {
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
 */
function _disconnect () {
    return this._client._stream && this._client._stream.end();
}

/**
 * Delete internal-purpose properties.
 */
function _cleanup () {
    delete this._properties.dbPassword;
    delete this._properties.socketFactory;
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
 * @param {string} schema - Name of the schema (database)
 * @returns {Schema}
 */
Session.prototype.getSchema = function (schema) {
    return new Schema(this, schema);
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

    return this._client
        .sqlStmtExecute('SHOW DATABASES', [], row => {
            schemas[row[0]] = this.getSchema(row[0]);
        })
        .then(() => schemas);
};

/**
 * Create a Schema in the database
 *
 * @param {string} schema - Name of the Schema
 * @returns {Promise.<Schema>}
 */
Session.prototype.createSchema = function (schema) {
    return this._client
        .sqlStmtExecute(`CREATE DATABASE ${Table.escapeIdentifier(schema)}`)
        .then(() => this.getSchema(schema));
};

/**
 * Drop Schema from database
 *
 * @param {string} schema
 * @returns {Promise.<Boolean>} - Promise resolving to true on success
 */
Session.prototype.dropSchema = function (schema) {
    return this._client
        .sqlStmtExecute(`DROP DATABASE ${Table.escapeIdentifier(schema)}`)
        .then(() => true);
};

/**
 * Drop a Collection
 * @param {string} schema
 * @param {string} collection
 * @returns {Promise.<boolean>}
 */
Session.prototype.dropCollection = function (schema, collection) {
    return this.getSchema(schema).dropCollection(collection);
};

/**
 * Drop a table
 *
 * @param {string} schema
 * @param {string} table
 * @returns {Promise.<boolean>}
 */
Session.prototype.dropTable = function (schema, table) {
    return this.getSchema(schema).dropTable(table);
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
    return this._client.sqlStmtExecute('BEGIN').then(() => true);
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
    return this._client.sqlStmtExecute('COMMIT').then(() => true);
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
    return this._client.sqlStmtExecute('ROLLBACK').then(() => true);
};

/**
 * Close the connection
 */
Session.prototype.close = function () {
    this._client.close();
};

Session.prototype.idGenerator = function () {
    const partial = (bytes) => crypto.randomBytes(bytes).toString('hex');

    return [partial(4), partial(2), partial(2), partial(2), partial(4)].join('-');
};

Session.prototype.inspect = function (depth) {
    const properties = Object.assign({}, this._properties);
    delete properties.endpoints;

    return properties;
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
    const args = parseFlexibleParamList(Array.prototype.slice.call(arguments, 1));

    return new Statement(this._client, sql, args);
};

/**
 * Alias for {@link Session#executeSql}.
 * @see {@link Session#executeSql}
 */
Session.prototype.sql = function (sql) {
    return this.executeSql(sql);
};
