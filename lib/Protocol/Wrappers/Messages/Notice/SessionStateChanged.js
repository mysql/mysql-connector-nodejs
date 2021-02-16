/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const SessionStateChangedStub = require('../../../Stubs/mysqlx_notice_pb').SessionStateChanged;
const bytes = require('../../ScalarValues/bytes');
const scalar = require('../Datatypes/Scalar');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Notice.SessionStateChanged
 * @param {proto.Mysqlx.Notice.SessionStateChanged} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Notice.SessionStateChanged}
 */
function SessionStateChanged (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Get the name of state parameter that has changed.
         * @function
         * @name module:adapters.Mysqlx.Notice.SessionStateChanged#getParameter
         * @returns {string}
         */
        getParameter () {
            return Object.keys(SessionStateChangedStub.Parameter)
                .filter(k => SessionStateChangedStub.Parameter[k] === proto.getParam())[0];
        },

        /**
         * Get parameter protocol identifier.
         * @function
         * @name module:adapters.Mysqlx.Notice.SessionStateChanged#getParameterId
         * @returns {number}
         */
        getParameterId () {
            return proto.getParam();
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Notice.SessionStateChanged#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return { param: this.getParameter(), value: proto.getValueList().map(v => scalar(v).toJSON()) };
        },

        /**
         * Return a plain JavaScript object version of the underlying protobuf instance.
         * @function
         * @name module:adapters.Mysqlx.Notice.SessionStateChanged#toObject
         * @returns {Object}
         */
        toObject () {
            return { type: proto.getParam(), values: proto.getValueList().map(v => scalar(v).toLiteral()) };
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Notice.SessionStateChanged}
 */
SessionStateChanged.deserialize = function (buffer) {
    return SessionStateChanged(SessionStateChangedStub.deserializeBinary(bytes.deserialize(buffer)));
};

SessionStateChanged.Parameter = SessionStateChangedStub.Parameter;

module.exports = SessionStateChanged;
