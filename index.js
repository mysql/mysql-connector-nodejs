"use strict";

var Session = require('./lib/DevAPI/Session'),
    NodeSession = require('./lib/DevAPI/NodeSession');

/**
 * MySQL X module
 *
 * @module mysqlx
 */

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<Session>}
 */
exports.getSession = function (properties) {
    var session = new Session(properties);
    return session.connect();
};

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<NodeSession>}
 */
exports.getNodeSession = function (properties) {
    var session = new NodeSession(properties);
    return session.connect();
};
