/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
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
