"use strict";

var Session = require('./lib/Session');
var SocketFactory = require('./lib/StreamFactory');

function NullLogger() {}
NullLogger.prototype.log = function () {};
NullLogger.prototype.info = function () {};
NullLogger.prototype.error = function () {};
NullLogger.prototype.warn = function () {};

module.exports = (function () {
    var globals = {};

    var logger = new NullLogger();
    globals.getLogger = function () { return logger; };

    var socketFactory = new SocketFactory(globals);
    globals.getSocketFactory = function () { return socketFactory; };

    return {
        getSession: function (properties) {
            var session = new Session(properties, globals);
            return session.connect();
        },
        setLogger: function (logger) {
            globals.getLogger = function () {
                return logger;
            };
        }
    };
}());
