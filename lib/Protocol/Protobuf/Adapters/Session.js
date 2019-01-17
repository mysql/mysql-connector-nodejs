/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
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

const AuthenticateContinue = require('../Stubs/mysqlx_session_pb').AuthenticateContinue;
const AuthenticateOk = require('../Stubs/mysqlx_session_pb').AuthenticateOk;
const AuthenticateStart = require('../Stubs/mysqlx_session_pb').AuthenticateStart;
const Close = require('../Stubs/mysqlx_session_pb').Close;
const Reset = require('../Stubs/mysqlx_session_pb').Reset;
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Decode a Mysqlx.Session.AuthenticateContinue protobuf message.
 * @function
 * @name module:Session#decodeAuthenticateContinue
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing authentication data
 */
exports.decodeAuthenticateContinue = function (data) {
    const proto = AuthenticateContinue.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Session.AuthenticateContinue', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Session.AuthenticateOk protobuf message.
 * @function
 * @name module:Session#decodeAuthenticateOk
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing authentication data
 */
exports.decodeAuthenticateOk = function (data) {
    const proto = AuthenticateOk.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Session.AuthenticateOk', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Session.AuthenticateStart protobuf message.
 * @function
 * @name module:Session#decodeAuthenticateStart
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing authentication data
 */
exports.decodeAuthenticateStart = function (data) {
    const proto = AuthenticateStart.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Session.AuthenticateStart', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Encode a Mysqlx.Session.AuthenticateStart protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateStart
 * @param {IAuthenticator} authenticator - authenticator instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateStart = function (authenticator) {
    const proto = new AuthenticateStart();
    proto.setMechName(authenticator.getName());
    proto.setAuthData(new Uint8Array(authenticator.getInitialAuthData()));

    debug('Mysqlx.Session.AuthenticateStart', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Session.AuthenticateContinue protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateContinue
 * @param {Buffer} data - raw authentication data
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateContinue = function (data) {
    const proto = new AuthenticateContinue();
    proto.setAuthData(new Uint8Array(data));

    debug('Mysqlx.Session.AuthenticateContinue', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Session.Close protobuf message.
 * @function
 * @name module:Session#encodeClose
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeClose = function () {
    const message = new Close();

    debug('Mysqlx.Connection.Close', JSON.stringify(message.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(message.serializeBinary());
};

/**
 * Encode a Mysqlx.Session.Reset protobuf message.
 * @function
 * @name module:Session#encodeReset
 * @param {Object} [options] - reset options
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeReset = function (options) {
    options = Object.assign({ keepOpen: true }, options);

    const message = new Reset();

    if (options.keepOpen) {
        message.setKeepOpen(options.keepOpen);
    }

    debug('Mysqlx.Connection.Close', JSON.stringify(message.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(message.serializeBinary());
};
