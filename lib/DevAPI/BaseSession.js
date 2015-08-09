"use strict";

var Protocol = require('./../Protocol/index');
var PlainAuth = require('./../Authentication/PlainAuth');
var MySQL41Auth = require('./../Authentication/MySQL41Auth');

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
 * @param globals
 * @constructor
 */
function BaseSession(properties, globals) {
    this._properties = properties;
    this._globals = globals;

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

    var socketFactory = self._properties.socket_factory || self._globals.getSocketFactory();

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


BaseSession.prototype.close = function () {
    this._protocol.close();
};
