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
 * Connection protobuf encoding adapter.
 * @private
 * @module Connection
 */

const Connection = require('../Stubs/mysqlx_connection_pb');
const Datatypes = require('./Datatypes');
const util = require('util');

const debug = util.debuglog('protobuf');

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
    capability.setValue(Datatypes.encodeAny(value));

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
