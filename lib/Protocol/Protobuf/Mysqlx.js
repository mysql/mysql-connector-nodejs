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
 * Mysqlx protobuf adapter.
 * @private
 * @module Mysqlx
 */

const Ok = require('../Stubs/mysqlx_pb').Ok;
const ServerError = require('../Stubs/mysqlx_pb').Error;
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Decode a Mysqlx.Ok protobuf message.
 * @function
 * @name module:Mysqlx#decodeOk
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object
 */
exports.decodeOk = function (data) {
    const proto = Ok.deserializeBinary(new Uint8Array(data));
    debug('Mysqlx.Ok', JSON.stringify(proto.toObject(), null, 2));

    const message = proto.getMsg();

    if (!message) {
        return {};
    }

    return { message };
};

/**
 * Decode a Mysqlx.Error protobuf message.
 * @function
 * @name module:Mysqlx#decodeError
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} A plain JavaScript object
 */
exports.decodeError = function (data) {
    const proto = ServerError.deserializeBinary(new Uint8Array(data));
    debug('Mysqlx.Error', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};
