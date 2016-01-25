/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

"use strict";

/**
 * PLAIN authentication scheme, sending username and password in plain text
 *
 * @implements {IAuthenticator}
 * @param properties
 * @constructor
 */
function PlainAuth(properties) {
    this._user = properties.dbUser;
    this._password = properties.dbPassword;
}

module.exports = PlainAuth;

PlainAuth.prototype.verifyServer = function (serverMethods) {
    return (serverMethods.indexOf(this.name) !== -1);
};

PlainAuth.prototype.name = "PLAIN";

PlainAuth.prototype.run = function (protocol) {
    return protocol.authenticate(this);
};

PlainAuth.prototype.getInitialAuthData = function () {
    var data = new Buffer(this._user.length + this._password.length + 3);
    data[0] = 0x00;
    data.write(this._user, 1);
    data[this._user.length + 1] = 0x00;
    data.write(this._password, this._user.length + 2);
    data[this._user.length + this._password.length + 2] = 0x00;
    return data;
};

PlainAuth.prototype.getNextAuthData = function (serverData) {
    throw new Error("Unexpected data: " + serverData);
};

require('./').register(PlainAuth);
