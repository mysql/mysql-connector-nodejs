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
 * Connection protobuf adapter.
 * @private
 * @module Connection
 */

const Connection = require('../Stubs/mysqlx_connection_pb');
const Datatypes = require('./Datatypes');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Decode a Mysqlx.Connection.Capabilities protobuf protobuf message.
 * @function
 * @name module:Connection#decodeCapabilities
 * @param {Buffer} data - raw protobuf message
 * @returns {object} An object containing the connection capabilities.
 */
exports.decodeCapabilities = function (data) {
    const proto = Connection.Capabilities.deserializeBinary(new Uint8Array(data));

    return proto
        .getCapabilitiesList()
        .reduce((capabilities, capability) => Object.assign(capabilities, this.decodeCapability(capability)), {});
};

/**
 * Decode a Mysqlx.Connection.Capability protobuf protobuf message.
 * @function
 * @name module:Connection#decodeCapability
 * @param {Mysqlx.Connection.Capabilities} proto - protobuf instance
 * @returns {object} A key-value pair decribing the capability.
 */
exports.decodeCapability = function (proto) {
    return { [proto.getName()]: Datatypes.extractAny(proto.getValue()) };
};

/**
 * Encode a Mysqlx.Connection.Capabilities protobuf message.
 * @function
 * @name module:Connection#encodeCapabilities
 * @param {Object} properties - connection properties
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeCapabilities = function (properties) {
    const capabilities = new Connection.Capabilities();

    Object.keys(properties).forEach(key => {
        capabilities.addCapabilities(this.encodeCapability(key, properties[key]));
    });

    return capabilities;
};

/**
 * Encode a Mysqlx.Connection.CapabilitiesGet protobuf message.
 * @function
 * @name module:Connection#encodeCapabilitiesGet
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeCapabilitiesGet = function () {
    const message = new Connection.CapabilitiesGet();

    debug('Mysqlx.Connection.CapabilitiesGet', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};

/**
 * Encode a Mysqlx.Connection.CapabilitiesSet protobuf message.
 * @function
 * @name module:Connection#encodeCapabilitiesSet
 * @param {Object} properties - connection properties
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeCapabilitiesSet = function (properties) {
    const message = new Connection.CapabilitiesSet();
    message.setCapabilities(this.encodeCapabilities(properties));

    debug('Mysqlx.Connection.CapabilitiesSet', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};

/**
 * Encode a Mysqlx.Connection.Capability protobuf message.
 * @function
 * @name module:Connection#encodeCapability
 * @param {string} name - capability name
 * @param {*} value - capability value
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeCapability = function (name, value) {
    const capability = new Connection.Capability();

    capability.setName(name);
    capability.setValue(Datatypes.createAny(value));

    return capability;
};

/**
 * Encode a Mysqlx.Connection.Close protobuf message.
 * @function
 * @name module:Connection#encodeClose
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeClose = function () {
    const message = new Connection.Close();

    debug('Mysqlx.Connection.Close', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};
