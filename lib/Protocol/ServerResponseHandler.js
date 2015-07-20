"use strict";

var Messages = require('./Messages');
var Datatype = require('./Datatype');

module.exports[Messages.ClientMessages.CON_CAPABILITIES_GET] = function (protocol) {
    this.expectedMessages = [Messages.ServerMessages.CONN_CAPABILITIES];
    this.protocol = protocol;
};

module.exports[Messages.ClientMessages.CON_CAPABILITIES_GET].prototype.handle = function (messageId, messageName, message) {
    this.protocol._serverCapabilitites = {};
    var self = this;
    message.capabilities.forEach(function (capabilitiy) {
        self.protocol._serverCapabilitites[capabilitiy.name] = Datatype.decodeAny(capabilitiy.value);
    });
    return true;
};