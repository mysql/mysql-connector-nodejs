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

const OpenStub = require('../../../Stubs/mysqlx_expect_pb').Open;
const condition = require('./Condition');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Expect.Open
 * @param {proto.Mysqlx.Expect.Open} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expect.Open}
 */
function Open (proto) {
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Retrieve the operation name.
         * @function
         * @name module:adapters.Mysqlx.Expect.Open#getOperation
         * @returns {string} The operation name
         */
        getOperation () {
            return Object.keys(OpenStub.CtxOperation)
                .filter(k => OpenStub.CtxOperation[k] === proto.getOp())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expect.Open#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                op: this.getOperation(),
                cond: proto.getCondList().map(c => condition(c).toJSON())
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expect.Open instance given a list of expectations.
 * @returns {module:adapters.Mysqlx.Expect.Open}
 */
Open.create = function (expectations) {
    const proto = new OpenStub();
    proto.setCondList(expectations.map(e => condition.create(e).valueOf()));

    return Open(proto);
};

module.exports = Open;
