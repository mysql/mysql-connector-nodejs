/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
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
 * Notice protobuf adapter.
 * @private
 * @module Notice
 */

const Datatypes = require('./Datatypes');
const Frame = require('../Stubs/mysqlx_notice_pb').Frame;
const SessionStateChanged = require('../Stubs/mysqlx_notice_pb').SessionStateChanged;
const SessionVariableChanged = require('../Stubs/mysqlx_notice_pb').SessionVariableChanged;
const Warning = require('../Stubs/mysqlx_notice_pb').Warning;
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Decode a Mysqlx.Notice.SessionStateChanged protobuf message (public API proxy).
 * @function
 * @name module:Notice#decodeSessionStateChanged_
 * @param {Uint8Array} data - protobuf bytes
 * @returns {Object} A plain JavaScript object containing the type and value of the state change
 */
function decodeSessionStateChanged_ (data) {
    const proto = SessionStateChanged.deserializeBinary(data);

    debug('Mysqlx.Notice.SessionStateChanged', JSON.stringify(proto.toObject(), null, 2));

    return { type: proto.getParam(), values: proto.getValueList().map(value => Datatypes.extractScalar(value)) };
};

/**
 * Decode a Mysqlx.Notice.SessionVariableChanged protobuf message (public API proxy).
 * @function
 * @name module:Notice#decodeSessionVariableChanged_
 * @param {Uint8Array} data - protobuf bytes
 * @returns {Object} A plain JavaScript object containing the name and value of the variable
 */
function decodeSessionVariableChanged_ (data) {
    const proto = SessionVariableChanged.deserializeBinary(data);

    debug('Mysqlx.Notice.SessionVariableChanged', JSON.stringify(proto.toObject(), null, 2));

    return { name: proto.getParam(), value: Datatypes.extractScalar(proto.getValue()) };
};

/**
 * Decode a Mysqlx.Notice.Warning protobuf message (public API proxy).
 * @function
 * @name module:Notice#decodeWarning_
 * @param {Uint8Array} data - protobuf bytes
 * @returns {Object} A plain JavaScript object containing details about the warning
 */
function decodeWarning_ (data) {
    const proto = Warning.deserializeBinary(data);

    debug('Mysqlx.Notice.Warning', JSON.stringify(proto.toObject(), null, 2));

    return { code: proto.getCode(), level: proto.getLevel(), message: proto.getMsg() };
}

/**
 * Decode a Mysqlx.Notice.Frame protobuf message.
 * @function
 * @name module:Notice#decodeFrame
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object
 * @throws Will throw an error if the protobuf instance type is not valid.
 */
exports.decodeFrame = function (data) {
    const proto = Frame.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Notice.Frame', JSON.stringify(proto.toObject(), null, 2));

    const payload = proto.getPayload();
    const frame = { scope: proto.getScope(), type: proto.getType() };

    switch (proto.getType()) {
    case Frame.Type.WARNING:
        return Object.assign(frame, { warning: decodeWarning_(payload) });
    case Frame.Type.SESSION_VARIABLE_CHANGED:
        return Object.assign(frame, { variable: decodeSessionVariableChanged_(payload) });
    case Frame.Type.SESSION_STATE_CHANGED:
        return Object.assign(frame, { state: decodeSessionStateChanged_(payload) });
    default:
        return frame;
    }
};

/**
 * Decode a Mysqlx.Notice.SessionStateChanged protobuf message.
 * @function
 * @name module:Notice#decodeSessionStateChanged
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing the type and value of the state change
 */
exports.decodeSessionStateChanged = function (data) {
    return decodeSessionStateChanged_(new Uint8Array(data));
};

/**
 * Decode a Mysqlx.Notice.SessionVariableChanged protobuf message.
 * @function
 * @name module:Notice#decodeSessionVariableChanged
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing the name and value of the variable
 */
exports.decodeSessionVariableChanged = function (data) {
    return decodeSessionVariableChanged_(new Uint8Array(data));
};

/**
 * Decode a Mysqlx.Notice.Warning protobuf message.
 * @function
 * @name module:Notice#decodeWarning
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object containing details about the warning
 */
exports.decodeWarning = function (data) {
    return decodeWarning_(new Uint8Array(data));
};
