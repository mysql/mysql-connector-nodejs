/*
 * Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved.
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

var Client = require('./../Protocol/Client');
var PlainAuth = require('./../Authentication/PlainAuth');
var MySQL41Auth = require('./../Authentication/MySQL41Auth');
var SocketFactory = require('./../SocketFactory');

var Schema = require('./Schema.js');
var Table = require('./Table');

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

    if (properties.idGenerator && typeof properties.idGenerator == 'function') {
        this.idGenerator = properties.idGenerator;
    }
}

module.exports = BaseSession;

/**
 * Connect to the database
 * @returns {Promise<BaseSession>} Promise resolving to myself
 */
BaseSession.prototype.connect = function () {
    var self = this;

    var socketFactory = self._properties.socketFactory || new SocketFactory();

    if (!this._properties.port) {
        this._properties.port = 33060;
    }
    return socketFactory.createSocket(self._properties).then(function (conn) {
        self._client = new Client(conn);

        if (false) {
            // TODO This causes issues when enabling SSL, bug MYP-264. Question: Do we really care about
            //      capabilities or can we simply be optimistic in regards to auth an SSL
            //      mind: If we're pessimistic we'd actually have to check capabilities, again,
            //      after enabling SSL as things change (i.e. PLAIN auth becomes available)
            self._client.capabilitiesGet(self._properties).then(function (serverCapabilities) {
                self._serverCapabilities = serverCapabilities;
            });
        }

        if (self._properties.ssl) {
            var options = self._properties.sslOptions || {};
            options.isServer = false;

            return self._client.enableSSL(options);
        }
    }).then(function () {
        var AuthConstructor = require('./../Authentication').get(self._properties.authMethod || 'MYSQL41');
        var auth = new AuthConstructor(self._properties);

        return auth.run(self._client);
    }).then(function () {
        delete self._properties.dbPassword;
        return self;
    }).catch(function (err) {
        delete self._properties.dbPassword;
        if (self._client && self._client._stream) {
            self._client._stream.end();
        }
        throw err;
    });
};

/**
 * Get instance of Schema object for a specific database schema
 *
 * This will always succeed, if if schema doesn't exist
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
    var self = this;
    var schemas = {};
    return self._client.sqlStmtExecute("SHOW DATABASES", [], function (row) {
        schemas[row[0]] = self.getSchema(row[0]);
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
    var self = this;
    return this._client.sqlStmtExecute("CREATE DATABASE " +  Table.escapeIdentifier(schema)).then(function () {
        return self.getSchema(schema);
    });
};

/**
 * Drop Schema from database
 *
 * @param {string} schema
 * @returns {Promise.<Boolean>} - Promise resolving to true on success
 */
BaseSession.prototype.dropSchema = function (schema) {
    var self = this;
    return  self._client.sqlStmtExecute("DROP DATABASE " + Table.escapeIdentifier(schema)).then(function () {
        return true;
    });
};

/**
 * Dop a Collection
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
 * Close the connection
 */
BaseSession.prototype.close = function () {
    this._client.close();
};

BaseSession.prototype.idGenerator = function () {
    return Math.floor(Math.random() * 500000) + '-' + Math.floor(Math.random() * 500000);
};

BaseSession.prototype.inspect = function (depth) {
    return this._properties;
};
