"use strict";

var BaseSession = require('./BaseSession');

/**
 * A session
 *
 * @extends {BaseSession}
 * @param {Properties} properties
 * @param globals
 * @constructor
 */
function Session(properties, globals) {
    BaseSession.call(this, properties, globals);
}

module.exports = Session;

Session.prototype = Object.create(BaseSession.prototype);