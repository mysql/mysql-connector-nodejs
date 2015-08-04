"use strict";

var BaseSession = require('./BaseSession');

/**
 * @api export
 * @constructor
 */
function Session(properties, globals) {
    BaseSession.call(this, properties, globals);
}

module.exports = Session;

Session.prototype = Object.create(BaseSession.prototype);