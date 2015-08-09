"use strict";

var Session = require('./lib/DevAPI/Session'),
    NodeSession = require('./lib/DevAPI/NodeSession'),
    SocketFactory = require('./lib/StreamFactory');

var mysqlx = module.exports;

mysqlx.getSession = function (properties) {
    var session = new Session(properties);
    return session.connect();
};
mysqlx.getNodeSession = function (properties) {
    var session = new NodeSession(properties);
    return session.connect();
};
