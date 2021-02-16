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

const WarningStub = require('../../../Stubs/mysqlx_notice_pb').Warning;
const bytes = require('../../../Wrappers/ScalarValues/bytes');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Notice.Warning
 * @param {proto.Mysqlx.Notice.Warning} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Notice.Warning}
 */
function Warning (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Get the warning log level tag.
         * @function
         * @name module:adapters.Mysqlx.Notice.Warning#getLevel
         * @returns {string}
         */
        getLevel () {
            return Object.keys(WarningStub.Level)
                .filter(k => WarningStub.Level[k] === proto.getLevel())[0];
        },

        getLevelId () {
            return proto.getLevel();
        },

        getCode () {
            return proto.getCode();
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Notice.Warning#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return { level: this.getLevel(), code: proto.getCode(), msg: proto.getMsg() };
        },

        /**
         * Return a plain JavaScript object version of the underlying protobuf instance.
         * @function
         * @name module:adapters.Mysqlx.Notice.Warning#toObject
         * @returns {Object}
         */
        toObject () {
            return proto.toObject();
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Notice.Warning}
 */
Warning.deserialize = function (buffer) {
    return Warning(WarningStub.deserializeBinary(bytes.deserialize(buffer)));
};

Warning.Level = WarningStub.Level;

module.exports = Warning;
