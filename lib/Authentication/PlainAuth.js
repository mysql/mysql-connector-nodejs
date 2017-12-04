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

'use strict';

/**
 * PLAIN authentication scheme, sending username and password in plain text
 *
 * @implements {IAuthenticator}
 * @param properties
 * @constructor
 * @private
 */
function PlainAuth (properties) {
    this._user = properties.dbUser;
    this._password = properties.dbPassword || '';
}

module.exports = PlainAuth;

PlainAuth.prototype.verifyServer = function (serverMethods) {
    return (serverMethods.indexOf(this.name) !== -1);
};

PlainAuth.prototype.name = 'PLAIN';

PlainAuth.prototype.run = function (protocol) {
    return protocol.authenticate(this);
};

PlainAuth.prototype.getInitialAuthData = function () {
    // TODO(Rui): user `Buffer.alloc()` from on node >= 4.5.0.
    const data = new Buffer(this._user.length + this._password.length + 2);
    data.fill(0);

    data.write(this._user, 1);
    data.write(this._password, this._user.length + 2);

    return data;
};

PlainAuth.prototype.getNextAuthData = function (serverData) {
    throw new Error(`Unexpected data: ${serverData}`);
};

require('./').register(PlainAuth);
