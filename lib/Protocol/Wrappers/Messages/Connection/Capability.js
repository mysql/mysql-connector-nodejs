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

const CapabilityStub = require('../../../Stubs/mysqlx_connection_pb').Capability;
const any = require('../Datatypes/Any');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Connection.Capability
 * @param {proto.Mysqlx.Connection.Capability} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Connection.Capability}
 */
function Capability (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Connection.Capability#toJSON
         * @returns {Object}
         */
        toJSON () {
            return { name: proto.getName(), value: any(proto.getValue()).toJSON() };
        },

        /**
         * Return a key-value mapping of the capability.
         * @function
         * @name module:adapters.Mysqlx.Connection.Capability#toObject
         * @returns {Object}
         */
        toObject () {
            return { [proto.getName()]: any(proto.getValue()).toLiteral() };
        }
    });
}

/**
 * Creates a wrapper of a Mysqlx.Connection.Capability instance for a key-value pair.
 * @param {string} name - property name
 * @param {*} value - property value
 * @returns {module:adapters.Mysqlx.Connection.Capability}
 */
Capability.create = function (name, value) {
    const proto = new CapabilityStub();
    proto.setName(name);
    proto.setValue(any.create(value).valueOf());

    return Capability(proto);
};

module.exports = Capability;
