/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

const Client = require('./../Protocol/Client'), 
    PlainAuth = require('./../Authentication/PlainAuth'), 
    MySQL41Auth = require('./../Authentication/MySQL41Auth'), 
    SocketFactory = require('./../SocketFactory'),
    parseUri = require('./Util/parseUri');

var Schema = require('./Schema.js');
var Table = require('./Table');

var crypto = require('crypto');
/**
 * A callback which produces IDs for documents
 * @callback IdGenerator
 * @return {string}
 */

/**
 * Properties object
 * @typedef {object} Properties
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
 * Constructor for a BaseSession,abstract
 *
 * @abstract
 * @param {Properties} properties
 * @constructor
 */
function BaseSession(properties) {
    if (typeof properties === 'string') {
        properties = parseUri(properties);
    }

    if (typeof properties !== 'object') {
        throw new TypeError("The properties argument should be an object");
    }

    /**
     * @type {Properties}
     * @private
     */
    this._properties = properties;

    /* TODO - these two should be grouped in a "Connection" object, so that a "BaseSession" can switch between Conenctions */
    /**
     * @type {Client}
     * @private
     */
    this._client = false;
    this._serverCapabilities = {};

    if (properties.idGenerator && typeof properties.idGenerator === 'function') {
        this.idGenerator = properties.idGenerator;
    }
}

module.exports = BaseSession;

/**
 * Connect to the database
 * @returns {Promise<BaseSession>} Promise resolving to myself
 */
BaseSession.prototype.connect = function () {
    var socketFactory = this._properties.socketFactory || new SocketFactory();

    if (!this._properties.port) {
        this._properties.port = 33060;
    }
    return socketFactory.createSocket(this._properties).then(conn => {
        this._client = new Client(conn);

        if (false) {
            // TODO This causes issues when enabling SSL, bug MYP-264. Question: Do we really care about
            //      capabilities or can we simply be optimistic in regards to auth an SSL
            //      mind: If we're pessimistic we'd actually have to check capabilities, again,
            //      after enabling SSL as things change (i.e. PLAIN auth becomes available)
            this._client.capabilitiesGet(this._properties).then(serverCapabilities => {
                this._serverCapabilities = serverCapabilities;
            });
        }

        if (this._properties.ssl) {
            const options = this._properties.sslOptions || {};
            options.isServer = false;

            return this._client.enableSSL(options);
        }
    }).then(() => {
        var AuthConstructor = require('./../Authentication').get(this._properties.authMethod || 'MYSQL41');
        var auth = new AuthConstructor(this._properties);

        return auth.run(this._client);
    }).then(() => {
        delete this._properties.dbPassword;
        return this;
    }).catch(err => {
        delete this._properties.dbPassword;
        if (this._client && this._client._stream) {
            this._client._stream.end();
        }
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
BaseSession.prototype.getSchema = function (schema) {
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
BaseSession.prototype.getSchemas = function () {
    var schemas = {};
    return this._client.sqlStmtExecute("SHOW DATABASES", [], row => {
        schemas[row[0]] = this.getSchema(row[0]);
    }).then(function () {
        return schemas;
    });
};

/**
 * Create a Schema in the database
 *
 * @param {string} schema - Name of the Schema
 * @returns {Promise.<Schema>}
 */
BaseSession.prototype.createSchema = function (schema) {
    return this._client.sqlStmtExecute("CREATE DATABASE " +  Table.escapeIdentifier(schema)).then(() => this.getSchema(schema));
};

/**
 * Drop Schema from database
 *
 * @param {string} schema
 * @returns {Promise.<Boolean>} - Promise resolving to true on success
 */
BaseSession.prototype.dropSchema = function (schema) {
    return  this._client.sqlStmtExecute("DROP DATABASE " + Table.escapeIdentifier(schema)).then(function () {
        return true;
    });
};

/**
 * Drop a Collection
 * @param {string} schema
 * @param {string} collection
 * @returns {Promise.<boolean>}
 */
BaseSession.prototype.dropCollection = function (schema, collection) {
    return this.getSchema(schema).dropCollection(collection);
};

/**
 * Drop a table
 *
 * @param {string} schema
 * @param {string} table
 * @returns {Promise.<boolean>}
 */
BaseSession.prototype.dropTable = function (schema, table) {
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
BaseSession.prototype.startTransaction = function (schema) {
    return this._client.sqlStmtExecute("BEGIN").then(() => true);
};

/**
 * Commit a transaction
 *
 * This will commit a transaction on the server. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 *
 * @returns {Promise.<bool>}
 */
BaseSession.prototype.commit = function (schema) {
    return this._client.sqlStmtExecute("COMMIT").then(() => true);
};

/**
 * Rollback a transaction
 *
 * This will rollback the current transaction. On success the returned Promise will resolve to true,
 * else the Promise will be rejected with an Error.
 * Create a Schema in the database
 *
 * @param {string} schema - Name of the Schema
 * @returns {Promise.<Schema>}
 */
BaseSession.prototype.rollback = function (schema) {
    return this._client.sqlStmtExecute("ROLLBACK").then(() => true);
};

/**
 * Close the connection
 */
BaseSession.prototype.close = function () {
    this._client.close();
};


BaseSession.prototype.idGenerator = function () {
    return crypto.randomBytes(4).toString('hex') +
        '-' + crypto.randomBytes(2).toString('hex') +
        '-' + crypto.randomBytes(2).toString('hex') +
        '-' + crypto.randomBytes(2).toString('hex') +
        '-' + crypto.randomBytes(4).toString('hex');
};

BaseSession.prototype.inspect = function (depth) {
    return this._properties;
};
