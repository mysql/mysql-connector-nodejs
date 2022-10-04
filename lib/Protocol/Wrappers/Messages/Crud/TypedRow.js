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

const TypedRowStub = require('../../../Stubs/mysqlx_crud_pb').Insert.TypedRow;
const expr = require('../../Messages/Expr/Expr');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Insert.TypedRow
 * @param {proto.Mysqlx.Crud.Insert.TypedRow} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Insert.TypedRow}
 */
function TypedRow (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Insert.TypedRow#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                field: proto.getFieldList().map(f => expr(f).toJSON())
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.Insert.TypedRow protobuf message given
 * a documents or a list of column values.
 * @private
 * @param {Array} columnOrValues
 * @returns {module:adapters.Mysqlx.Crud.Insert.TypedRow}
 */
TypedRow.create = function (...columnValues) {
    const proto = new TypedRowStub();
    // `undefined` values should not be encoded at all
    const fieldList = columnValues.flat()
        .filter(({ value }) => typeof value !== 'undefined')
        .map(columnValue => expr.create(columnValue).valueOf());

    proto.setFieldList(fieldList);

    return TypedRow(proto);
};

module.exports = TypedRow;
