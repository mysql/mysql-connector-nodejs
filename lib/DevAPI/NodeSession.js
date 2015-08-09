"use strict";

var BaseSession = require('./BaseSession');

/**
 * Session to an individual server
 *
 * @param {Properties} properties
 * @param globals
 * @extends {BaseSession}
 * @constructor
 */
function NodeSession(properties, globals) {
    BaseSession.call(this, properties, globals);
}

module.exports = NodeSession;

NodeSession.prototype = Object.create(BaseSession.prototype);

/**
 * Execute SQL query
 * @param {string} sql SQL string
 * @return {Promise}
 */
NodeSession.prototype.executeSql = function (sql) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return this._session._protocol.sqlStmtExecute(sql, args);
};
