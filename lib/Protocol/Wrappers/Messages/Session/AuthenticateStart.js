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

const AuthenticateStartStub = require('../../../Stubs/mysqlx_session_pb').AuthenticateStart;
const bytes = require('../../ScalarValues/bytes');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Session.AuthenticateStart
 * @param {proto.Mysqlx.Session.AuthenticateStart} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Session.AuthenticateStart}
 */
function AuthenticateStart (proto) {
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Session.AuthenticateStart#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                mech_name: proto.getMechName(),
                auth_data: bytes(proto.getAuthData()).toJSON(),
                initial_response: bytes(proto.getInitialResponse()).toJSON()
            };
        },

        /**
         * Return a plain JavaScript object version of the underlying protobuf instance.
         * @function
         * @name module:adapters.Mysqlx.Session.AuthenticateStart#toObject
         * @returns {Object}
         */
        toObject () {
            return proto.toObject();
        }
    });
}

/**
 * Creates and wraps a Mysqlx.Session.AuthenticateStart instance with a given token.
 * @returns {module:adapters.Mysqlx.Session.AuthenticateStart}
 */
AuthenticateStart.create = function (mechanism, password) {
    const proto = new AuthenticateStartStub();
    proto.setMechName(mechanism);
    proto.setAuthData(bytes.deserialize(password).valueOf());

    return AuthenticateStart(proto);
};

module.exports = AuthenticateStart;
