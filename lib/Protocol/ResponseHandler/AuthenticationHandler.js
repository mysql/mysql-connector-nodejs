"use strict";

var Messages = require('../Messages');
var ResponseHandler = require('./ResponseHandler.js');

function AuthenticationHandler(auth, protocol) {
    ResponseHandler.call(this);
    this._auth = auth;
    this._protocol = protocol;
}
module.exports = AuthenticationHandler;

AuthenticationHandler.prototype = Object.create(ResponseHandler.prototype);

AuthenticationHandler.prototype[Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE] = function (message, queueDone) {
    try {
        this._protocol.authenticateContinue(this._auth.getNextAuthData(message.auth_data), this);
    } catch (err) {
        queueDone();
        this._fail(err);
    }
};

AuthenticationHandler.prototype[Messages.ServerMessages.SESS_AUTHENTICATE_OK] = function (message, queueDone) {
    queueDone();
    this._resolve();
};
