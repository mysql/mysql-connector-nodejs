"use strict";

var Messages = require('../Messages');
var Datatype = require('../Datatype');
var ResponseHandler = require('./ResponseHandler.js');

function CapabilitiesGetHandler(protocol) {
    ResponseHandler.call(this);
    this._protocol = protocol;
}

module.exports = CapabilitiesGetHandler;

CapabilitiesGetHandler.prototype = Object.create(ResponseHandler.prototype);

CapabilitiesGetHandler.prototype[Messages.ServerMessages.CONN_CAPABILITIES] = function (message, queueDone) {
    var serverCapabilities = {};

    if (message.capabilities) {
        message.capabilities.forEach(function (capabilitiy) {
            serverCapabilities[capabilitiy.name] = Datatype.decodeAny(capabilitiy.value);
        });
    }

    queueDone();
    this._resolve(serverCapabilities);
};
