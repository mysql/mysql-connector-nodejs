"use strict";

var Protocol = require('./../Protocol/index');
var PlainAuth = require('./../Authentication/PlainAuth');
var MySQL41Auth = require('./../Authentication/MySQL41Auth');
var SocketFactory = require('./../SocketFactory');

var Schema = require('./Schema.js');

/**
 * Properties object
 * @typedef {object} Properties
 * @property {string} host Hostname to connect to
 * @property {number} port Port number
 * @property {string} dbUser Username
 * @property {string} dbPassword Password
 * @property {string} auth_method Name of an authentication mehod to use (default: MySQL41)
 * @property {SocketFactory} socket_factory A factory which can creaes sockt, usually not needed outside tests
 */

/**
 * Constructor for a BaseSession,abstract
 *
 * @abstract
 * @param {Properties} properties
 * @constructor
 */
function BaseSession(properties) {
    this._properties = properties;

    /* TODO - these two should be grouped in a "Connection" object, so that a "BaseSession" can switch between Conenctions */
    this._protocol = false;
    this._serverCapabilities = {};
}

module.exports = BaseSession;

/**
 * Connect to the database
 * @returns {Promise<BaseSession>} Promise resolving to myself
 */
BaseSession.prototype.connect = function () {
    var self = this;

    var socketFactory = self._properties.socket_factory || new SocketFactory();

    return socketFactory.createSocket(self._properties).then(function (conn) {
        self._protocol = new Protocol(conn);
        self._protocol.capabilitiesGet(self._properties).then(function (serverCapabilities) {
            self._serverCapabilities = serverCapabilities;
        });

        var authConstructor = require('./../Authentication').get(self._properties.auth_method || 'MYSQL41');
        var auth = new authConstructor(self._properties);
        return auth.run(self._protocol);
    }).then(function () {
        return self;
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
    return self._protocol.sqlStmtExecute("SHOW DATABASES", [], function (row) {
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
    return this._protocol.sqlStmtExecute("CREATE DATABASE `" + schema + "`").then(function () {
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
    return  self._protocol.sqlStmtExecute("DROP DATABASE `" + schema + "`").then(function () {
        return true;
    });
};

/**
 * Close the connection
 */
BaseSession.prototype.close = function () {
    this._protocol.close();
};
