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

const LimitStub = require('../../../Stubs/mysqlx_crud_pb').Limit;
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Limit
 * @param {proto.Mysqlx.Crud.Limit} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Limit}
 */
function Limit (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Limit#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            // Mysqlx.Crud.Limit and Mysqlx.Crud.LimitExpr are exclusive which
            // means one of them will be undefined.
            if (typeof proto === 'undefined') {
                // In that case, we want the field to be ignored in the parent object.
                return;
            }

            return {
                row_count: proto.getRowCount(),
                offset: proto.getOffset()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Crud.Limit instance given a count (and offset).
 * @param {number} count
 * @param {number} [offset]
 * @returns {module:adapters.Mysqlx.Crud.Limit}
 */
Limit.create = function (count, offset) {
    // If the count is not defined there's nothing to do.
    // We can't wrap an empty Mysqlx.Crud.Limit stub instance because it
    // contains a default value of 0 for count, and that is not the
    // intended behaviour.
    if (typeof count === 'undefined') {
        return Limit();
    }

    const proto = new LimitStub();

    // count is requireds
    proto.setRowCount(count);

    // offset is optional
    if (typeof offset !== 'undefined') {
        proto.setOffset(offset);
    }

    return Limit(proto);
};

module.exports = Limit;
