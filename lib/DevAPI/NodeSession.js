"use strict";

var BaseSession = require('./BaseSession');

function NodeSession() {
    BaseSession.call(this);
}

module.exports = NodeSession;

NodeSession.prototype = Object.create(BaseSession.prototype);
