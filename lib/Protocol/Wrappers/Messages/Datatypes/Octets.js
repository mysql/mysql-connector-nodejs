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

const ContentType = require('../../../Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const bytes = require('../../ScalarValues/bytes');
const wraps = require('../../Traits/Wraps');

/**
 * Wrapper for the Mysqlx.Datatypes.Scalar.Octets protobuf stub.
 * @private
 * @alias module:adapters.Mysqlx.Datatypes.Scalar.Octets
 * @param {proto.Mysqlx.Datatypes.Scalar.Octets} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.Scalar.Octets}
 */
function Octets (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the Content-Type of the underlying binary data.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Octets#getContentType
         * @returns {string}
         */
        getContentType () {
            return Object.keys(ContentType).filter(id => ContentType[id] === proto.getContentType())[0];
        },

        /**
         * Convert the underlying binary content to a Node.js Buffer instance.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Octets#toBuffer
         * @returns {Buffer}
         */
        toBuffer () {
            return bytes(proto.getValue()).toBuffer();
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Octets#toJSON
         * @returns {Object}
         */
        toJSON () {
            return {
                content_type: this.getContentType(),
                value: bytes(proto.getValue()).toJSON()
            };
        }
    });
}

module.exports = Octets;
