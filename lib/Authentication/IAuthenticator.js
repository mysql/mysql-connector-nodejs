"use strict";
/**
 * Authentication Plugin Support
 * @module mysqlx/Authentication
 */

/**
 * Interface for an authenticator
 *
 * This interface describes the required members for an authentication mechanism.
 *
 * @interface
 */
function IAuthenticator() {}

module.exports = IAuthenticator;


/**
 * Confirm whether this handler implements an authentication mechanism  supported by the server.
 *
 * A trivial sample implementation is provided inline.
 *
 * Note: Don' rely on this being called. The user might decide to skip then CapabilitiesGet
 * call.
 *
 * @param serverMethods {array} Array of authentication mechanisms supported by the server as returned from CapabilitiesGet call
 * @returns {boolean}
 */
IAuthenticator.prototype.verifyServer = function (serverMethods) {
    return (serverMethods.indexOf(this.name) !== -1);
};

/**
 * Name of this mechanism. Will be reported to the server.
 *
 * @type {string}
 */
IAuthenticator.prototype.name = "PLAIN";

/**
 * Run authentication
 * @param protocol
 * @return Promise
 */
IAuthenticator.prototype.run = function (protocol) {
    //return protocol.authenticate(this);
};

/**
 * Gets the auth_data for the AutenticationStart message.
 * @returns {Buffer}
 */
IAuthenticator.prototype.getInitialAuthData = function () {};

/**
 * Authentication data for AuthenticateContinue messages.
 * This will be called repeatedly after getInitialAuthData as long as the server requests more
 * data.
 * @param serverData
 */
IAuthenticator.prototype.getNextAuthData = function (serverData) {};
