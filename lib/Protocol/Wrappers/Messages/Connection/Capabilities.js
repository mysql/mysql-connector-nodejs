/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const ServerMessagesStub = require('../../../Stubs/mysqlx_pb').ServerMessages.Type;
const CapabilitiesStub = require('../../../Stubs/mysqlx_connection_pb').Capabilities;
const bytes = require('../../ScalarValues/bytes');
const capability = require('./Capability');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Connection.Capabilities
 * @param {proto.Mysqlx.Connection.Capabilities} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Connection.Capabilities}
 */
function Capabilities (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Connection.Capabilities#toJSON
         * @returns {Object}
         */
        toJSON () {
            return { capabilities: proto.getCapabilitiesList().map(value => capability(value).toJSON()) };
        },

        /**
         * Return a key-value mapping of the existing capabilities.
         * @function
         * @name module:adapters.Mysqlx.Connection.Capabilities#toObject
         * @returns {Object}
         */
        toObject () {
            return proto.getCapabilitiesList()
                .reduce((capabilities, value) => Object.assign({}, capabilities, capability(value).toObject()), {});
        }
    });
}

/**
 * Creates a wrapper of a Mysqlx.Connection.Capabilities instance for the given properties.
 * @param {Object} properties - object with a key-value mapping of the properties
 * @returns {module:adapters.Mysqlx.Connection.Capabilities}
 */
Capabilities.create = function (properties) {
    const proto = new CapabilitiesStub();
    proto.setCapabilitiesList(Object.keys(properties).map(k => capability.create(k, properties[k]).valueOf()));

    return Capabilities(proto);
};

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Connection.Capabilities}
 */
Capabilities.deserialize = function (buffer) {
    return Capabilities(CapabilitiesStub.deserializeBinary(bytes.deserialize(buffer).valueOf()));
};

Capabilities.MESSAGE_ID = ServerMessagesStub.CONN_CAPABILITIES;

module.exports = Capabilities;
