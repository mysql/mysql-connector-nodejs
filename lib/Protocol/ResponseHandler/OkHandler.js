"use strict";

var Messages = require('../Messages');
var ResponseHandler = require('./ResponseHandler.js');

function OkHandler() {
    ResponseHandler.call(this);
}
module.exports = OkHandler;

OkHandler.prototype = Object.create(ResponseHandler.prototype);

OkHandler.prototype[Messages.ServerMessages.OK] = function(message, queueDone) {
    queueDone();
    this._resolve();
};
