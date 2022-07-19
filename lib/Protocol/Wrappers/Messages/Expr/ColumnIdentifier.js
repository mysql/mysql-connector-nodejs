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

const ColumnIdentifierStub = require('../../../Stubs/mysqlx_expr_pb').ColumnIdentifier;
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
ColumnIdentifier.create = function (str, options) {
    options = Object.assign({}, { type: parser.Type.COLUMN_OR_PATH }, options);
    const { value } = parser.parse(str, options);
    return ColumnIdentifier(ColumnIdentifier.encode(value));
};

/**
 * Encode an column identifier expression tree structure into the corresponding
 * protobuf message.
 * @param {Object[]} documentPath - A list containing the tree structure of each element of the document path.
 * @param {string} [name] - The name of the column in table mode.
 * @param {string} [schema] - The name of the schema in table mode.
 * @param {string} [table] - The name of the table in table mode.
 * @returns {proto:Mysqlx.Expr.Identifier}
 */
ColumnIdentifier.encode = ({ documentPath, name, schema, table }) => {
    const proto = new ColumnIdentifierStub();
    proto.setDocumentPathList(documentPath.map(item => documentPathItem.encode(item)));
    proto.setName(name);
    proto.setTableName(table);
    proto.setSchemaName(schema);

    return proto;
};

module.exports = ColumnIdentifier;
