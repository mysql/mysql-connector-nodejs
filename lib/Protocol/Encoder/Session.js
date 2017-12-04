/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
