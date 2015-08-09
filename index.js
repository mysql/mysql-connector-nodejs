"use strict";

var Session = require('./lib/DevAPI/Session'),
    NodeSession = require('./lib/DevAPI/NodeSession'),
    SocketFactory = require('./lib/StreamFactory');

module.exports = (function () {
    return {
        getSession: function (properties) {
            var session = new Session(properties);
            return session.connect();
        },
        getNodeSession: function (properties) {
            var session = new NodeSession(properties);
            return session.connect();
        }
    };
}());
