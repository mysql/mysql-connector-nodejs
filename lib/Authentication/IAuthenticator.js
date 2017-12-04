/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

"use strict";
/**
 * Interface for an authenticator
 *
 * This interface describes the required members for an authentication mechanism.
 * A custom implementation has to be registerd using
 * require('./').register(Constructor);
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
 * Note: Don't rely on this being called. The user might decide to skip the CapabilitiesGet
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
IAuthenticator.prototype.name = "NONE";

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
