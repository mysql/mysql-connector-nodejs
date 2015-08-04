"use strict";

var Session = require('./lib/DevAPI/BaseSession'),
    SocketFactory = require('./lib/StreamFactory');

module.exports = (function () {
    var globals = {};

    var socketFactory = new SocketFactory(globals);
    globals.getSocketFactory = function () { return socketFactory; };

    return {
        getSession: function (properties) {
            var session = new Session(properties, globals);
            return session.connect();
        }
    };
}());
