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

const documentPathItem = require('./DocumentPathItem');
const list = require('../../Traits/List');
const optionalString = require('../../Traits/OptionalString');
const parser = require('../../../../ExprParser');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.ColumnIdentifier
 * @param {proto.Mysqlx.Expr.ColumnIdentifier} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.ColumnIdentifier}
 */
function ColumnIdentifier (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.ColumnIdentifier#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                document_path: list(proto.getDocumentPathList().map(item => documentPathItem(item))).toJSON(),
                name: optionalString(proto.getName()).toJSON(),
                table_name: optionalString(proto.getTableName()).toJSON(),
                schema_name: optionalString(proto.getSchemaName()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expr.ColumnIdentifier instance given an expression.
 * @returns {module:adapters.Mysqlx.Expr.ColumnIdentifier}
 */
ColumnIdentifier.create = function (value, options) {
    options = Object.assign({}, { type: parser.Type.COLUMN_OR_PATH }, options);

    return ColumnIdentifier(parser.parse(value, options).getIdentifier());
};

module.exports = ColumnIdentifier;
