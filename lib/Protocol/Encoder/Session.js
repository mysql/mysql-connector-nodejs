/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
 * Session protobuf encoding adapter.
 * @private
 * @module Session
 */

const Session = require('../Stubs/mysqlx_session_pb');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Encode a Mysqlx.Session.AuthenticateStart protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateStart
 * @param {IAuthenticator} authenticator - authenticator instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateStart = function (authenticator) {
    const message = new Session.AuthenticateStart();
    // TODO(Rui): authenticator.getName() after refactoring the authenticator interface
    message.setMechName(authenticator.name);
    message.setAuthData(new Uint8Array(authenticator.getInitialAuthData()));

    debug('Mysqlx.Session.AuthenticateStart', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};

/**
 * Encode a Mysqlx.Session.AuthenticateContinue protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateContinue
 * @param {Buffer} data - raw authentication data
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateContinue = function (data) {
    const message = new Session.AuthenticateContinue();
    message.setAuthData(new Uint8Array(data));

    debug('Mysqlx.Session.AuthenticateContinue', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};
