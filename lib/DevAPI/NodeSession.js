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
