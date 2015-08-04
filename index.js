"use strict";

var Session = require('./lib/DevAPI/Session'),
    NodeSession = require('./lib/DevAPI/NodeSession'),
    SocketFactory = require('./lib/StreamFactory');

module.exports = (function () {
    var globals = {};

    var socketFactory = new SocketFactory(globals);
    globals.getSocketFactory = function () { return socketFactory; };

    return {
        getSession: function (properties) {
            var session = new Session(properties, globals);
            return session.connect();
        },
        getNodeSession: function (properties) {
            var session = new NodeSession(properties, globals);
            return session.connect();
        }
    };
}());
