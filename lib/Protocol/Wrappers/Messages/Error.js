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

const MysqlxStub = require('../../Stubs/mysqlx_pb');
const bytes = require('../ScalarValues/bytes');
const serializable = require('../Traits/Serializable');
const wraps = require('../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Error
 * @param {proto.Mysqlx.Error} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Error}
 */
function Error (proto) {
    // The serializable trait is needed in order to re-use the work queue
    // error handling handling logic.
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Get the error severity.
         * @function
         * @name module:adapters.Mysqlx.Error#getSeverity
         * @returns {string}
         */
        getSeverity () {
            return Object.keys(MysqlxStub.Error.Severity)
                .filter(k => MysqlxStub.Error.Severity[k] === proto.getSeverity())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Error#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                severity: this.getSeverity(),
                code: proto.getCode(),
                sql_state: proto.getSqlState(),
                msg: proto.getMsg()
            };
        },

        /**
         * Return a plain JavaScript object version of the underlying protobuf instance.
         * @function
         * @name module:adapters.Mysqlx.Error#toObject
         * @returns {Object}
         */
        toObject () {
            return proto.toObject();
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Error instance for a error message.
 * @returns {module:adapters.Mysqlx.Error}
 */
Error.create = function (message) {
    const proto = new MysqlxStub.Error();
    // TODO(Rui): create a convention for error codes (X DevAPI worklog)
    proto.setMsg(message);

    return Error(proto);
};

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Error}
 */
Error.deserialize = function (buffer) {
    return Error(MysqlxStub.Error.deserializeBinary(bytes.deserialize(buffer).valueOf()));
};

Error.MESSAGE_ID = MysqlxStub.ServerMessages.Type.ERROR;
Error.SERVER_GONE = -1;

module.exports = Error;
