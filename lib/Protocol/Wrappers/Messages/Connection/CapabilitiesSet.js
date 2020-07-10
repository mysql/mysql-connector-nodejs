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

const CapabilitiesSetStub = require('../../../Stubs/mysqlx_connection_pb').CapabilitiesSet;
const capabilities = require('./Capabilities');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Connection.CapabilitiesSet
 * @param {proto.Mysqlx.Connection.CapabilitiesSet} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Connection.CapabilitiesSet}
 */
function CapabilitiesSet (proto) {
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Connection.CapabilitiesSet#toJSON
         * @returns {Object}
         */
        toJSON () {
            return { capabilities: capabilities(proto.getCapabilities()).toJSON() };
        }
    });
}

/**
 * Creates a wrapper of a Mysqlx.Connection.CapabilitiesSet instance for the given properties.
 * @param {Object} properties - object with a key-value mapping of the properties
 * @returns {module:adapters.Mysqlx.Connection.CapabilitiesSet}
 */
CapabilitiesSet.create = function (properties) {
    const proto = new CapabilitiesSetStub();
    proto.setCapabilities(capabilities.create(properties).valueOf());

    return CapabilitiesSet(proto);
};

module.exports = CapabilitiesSet;
