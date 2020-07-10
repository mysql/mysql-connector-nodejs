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

const ConditionStub = require('../../../Stubs/mysqlx_expect_pb').Open.Condition;
const bytes = require('../../ScalarValues/bytes');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Expect.Condition
 * @param {proto.Mysqlx.Expect.Condition} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expect.Condition}
 */
function Condition (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the name of the key for the expected condition.
         * @function
         * @name module:adapters.Mysqlx.Expect.Condition#getKey
         * @returns {string} The key name
         */
        getKey () {
            return Object.keys(ConditionStub.Key)
                .filter(k => ConditionStub.Key[k] === proto.getConditionKey())[0];
        },

        /**
         * Retrieve the name of the operation to execute if the condition passes.
         * @function
         * @name module:adapters.Mysqlx.Expect.Condition#getOperation
         * @returns {string} The operation name
         */
        getOperation () {
            return Object.keys(ConditionStub.ConditionOperation)
                .filter(k => ConditionStub.ConditionOperation[k] === proto.getOp())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expect.Condition#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                condition_key: this.getKey(),
                condition_value: bytes(proto.getConditionValue()).toJSON(),
                op: this.getOperation()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expect.Condition instance for a given expectation.
 * @returns {module:adapters.Mysqlx.Expect.Condition}
 */
Condition.create = function (expectation) {
    const proto = new ConditionStub();
    proto.setConditionKey(expectation.key);
    // eslint-disable-next-line node/no-deprecated-api
    proto.setConditionValue(bytes.deserialize(new Buffer(expectation.value)).valueOf());
    proto.setOp(expectation.condition);

    return Condition(proto);
};

Condition.ACTION = ConditionStub.ConditionOperation;
Condition.TYPE = ConditionStub.Key;

module.exports = Condition;
