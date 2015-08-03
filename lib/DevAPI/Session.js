"use strict";

var BaseSession = require('./BaseSession');

function Session() {
    BaseSession.call(this);
}

module.exports = Session;

Session.prototype = Object.create(BaseSession.prototype);