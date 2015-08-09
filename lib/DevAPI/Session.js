"use strict";

var BaseSession = require('./BaseSession');

/**
 * A session
 *
 * @extends {BaseSession}
 * @param {Properties} properties
 * @constructor
 */
function Session(properties) {
    BaseSession.call(this, properties);
}

module.exports = Session;

Session.prototype = Object.create(BaseSession.prototype);