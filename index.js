"use strict";

const XSession = require('./lib/DevAPI/XSession'),
    NodeSession = require('./lib/DevAPI/NodeSession'),
    Expressions = require('./lib/Expressions');

/**
 * MySQL X module
 *
 * @module mysqlx
 */

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<XSession>}
 */
exports.getSession = function (properties) {
    const session = new XSession(properties);
    return session.connect();
};

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<NodeSession>}
 */
exports.getNodeSession = function (properties) {
    const session = new NodeSession(properties);
    return session.connect();
};

/**
 * Parse an expression into parse tree
 * @param {String} exp Expression
 * @eturn {Expression}
 */
exports.expr = function (exp) {
    return Expressions.parse(exp);
};

exports.mysqlx = exports;
