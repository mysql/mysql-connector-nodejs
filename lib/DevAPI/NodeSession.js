"use strict";

var BaseSession = require('./BaseSession');

function NodeSession(properties, globals) {
    BaseSession.call(this, properties, globals);
}

module.exports = NodeSession;

NodeSession.prototype = Object.create(BaseSession.prototype);
