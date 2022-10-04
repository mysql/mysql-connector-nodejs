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

const ColumnStub = require('../../../Stubs/mysqlx_crud_pb').Column;
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Column
 * @param {proto.Mysqlx.Crud.Column} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Column}
 */
function Column (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Column#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                // In this case, the value of "name" is not an optional string
                // because it is always defined (Mysqlx.Crud.Column does not
                // make a lot of sense). Additionally, this message is only
                // used on TABLE mode, which means the remaining parameters
                // never defined.
                name: proto.getName()
            };
        }
    });
}

/**
 * Creates a wrapper for generic Mysqlx.Crud.Column protobuf message the
 * column name.
 * @private
 * @param {string} name
 * @returns {module:adapters.Mysqlx.Crud.Column}
 */
Column.create = function (name) {
    const proto = new ColumnStub();
    // Only the column name is supported which means that, in the end, it will
    // always be a string and the Mysqlx.Crud.Column message type is a waste
    proto.setName(name);

    return Column(proto);
};

module.exports = Column;
