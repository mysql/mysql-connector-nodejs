/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const bytes = require('../../ScalarValues/bytes');
const collations = require('../../../collations.json');
const wraps = require('../../Traits/Wraps');

/**
 * Wrapper for the Mysqlx.Datatypes.Scalar.String protobuf stub.
 * @private
 * @alias module:adapters.Mysqlx.Datatypes.String
 * @param {proto.Mysqlx.Datatypes.String} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.String}
 */
function String (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the charset used to encode the string.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.String#getCharset
         * @returns {string} The charset name.
         */
        getCharset () {
            // We cannot rely on the "proto.hasCollation()" API because, by
            // default, the collation id the will not be undefined but will be
            // 0 instead, which from the protobuf library standpoint means the
            // stub has, indeed, a collation (one which is not known to MySQL).
            const collationId = this.getCollationId();

            if (!collationId) {
                return;
            }

            return collations.find(({ id }) => id === collationId).charset;
        },

        /**
         * Retrieve the id of the collation used to encode the string.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.String#getCollationId
         * @returns {number} The collation id.
         */
        getCollationId () {
            // The stub is created with a default value of 0, which does not
            // match any valid collation, so it should be undefined.
            return proto.getCollation() > 0 ? proto.getCollation() : undefined;
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.String#toJSON
         * @returns {Object}
         */
        toJSON () {
            return {
                collation: this.getCollationId(),
                value: this.toString()
            };
        },

        /**
         * Decode the underlying binary content.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.String#toString
         * @returns {string}
         */
        toString () {
            const binary = bytes(proto.getValue());

            if (this.getCharset() !== 'binary') {
                return binary.toString(); // utf8
            }

            return binary.toString('base64');
        }
    });
}

module.exports = String;
