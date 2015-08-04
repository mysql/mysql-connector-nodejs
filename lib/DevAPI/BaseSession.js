"use strict";

var Protocol = require('./../Protocol/index');
var PlainAuth = require('./../Authentication/PlainAuth');
var MySQL41Auth = require('./../Authentication/MySQL41Auth');

var Schema = require('./Schema.js');

function BaseSession(properties, globals) {
    this._properties = properties;
    this._globals = globals;

    /* TODO - these two should be grouped in a "Connection" object, so that a "BaseSession" can switch between Conenctions */
    this._protocol = false;
    this._serverCapabilities = {};
}

module.exports = BaseSession;

BaseSession.prototype.connect = function () {
    var self = this;

    return new Promise(function (resolve, fail) {
        self._globals.getSocketFactory().createSocket(self._properties).then(function (conn) {
            self._protocol = new Protocol(conn);
            self._protocol.capabilitiesGet(self._properties).then(function (serverCapabilities) {
                self._serverCapabilities = serverCapabilities;
            });

            var authConstructor = require('./../Authentication').get(self._properties.auth_method || 'MYSQL41');
            var auth = new authConstructor(self._properties);
            return self._protocol.authenticate(auth);
        }).then(function () {
            resolve(self);
        }).catch(function (err) {
            fail(err);
        });
    });
};

BaseSession.prototype.getSchema = function (schema) {
    return new Schema(this, schema);
};


// Experimental functions below

BaseSession.prototype.insert = function (schema, collection, document) {
    return this._protocol.crudInsert(this, schema, collection, document);
};

BaseSession.prototype.find = function (schema, collection, rowcb, metacb) {
    return this._protocol.crudFind(this, schema, collection, null, rowcb, metacb);
};

BaseSession.prototype.close = function () {
    this._protocol.close();
};
