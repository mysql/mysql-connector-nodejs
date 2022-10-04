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
const DocumentPathItem = require('./DocumentPathItem');
const List = require('../../Traits/List');
const OptionalString = require('../../Traits/OptionalString');
const Wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.ColumnIdentifier
 * @param {proto.Mysqlx.Expr.ColumnIdentifier} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.ColumnIdentifier}
 */
function ColumnIdentifier (proto) {
    return {
        ...Wraps(proto),
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.ColumnIdentifier#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                document_path: List(proto.getDocumentPathList().map(item => DocumentPathItem(item))).toJSON(),
                name: OptionalString(proto.getName()).toJSON(),
                table_name: OptionalString(proto.getTableName()).toJSON(),
                schema_name: OptionalString(proto.getSchemaName()).toJSON()
            };
        }
    };
}

/**
 * Create a wrapper for a Mysqlx.Expr.ColumnIdentifier protobuf message given
 * a list of document path items and/or a column name and/or a table name
 * and/or a schema name. Under the DOCUMENT data model, only the document path
 * is provided, otherwise, under the TABLE data model, besides the column name,
 * any of the other parameters can also be provided.
 * @param {ExpressionTree[]} [documentPath] - List containing the X DevAPI
 * expression for element in the document path (TABLE and DOCUMENT mode).
 * @param {string} [name] - Name of the column (TABLE mode only).
 * @param {string} [schema] - Name of the schema (TABLE mode only).
 * @param {string} [table] - Name of the table (TABLE mode only).
 * @returns {module:adapters.Mysqlx.Expr.ColumnIdentifier}
 */
ColumnIdentifier.create = ({ documentPath, name, schema, table } = {}) => {
    const proto = new ColumnIdentifierStub();
    proto.setDocumentPathList(documentPath.map(item => DocumentPathItem.create(item).valueOf()));
    proto.setName(name);
    proto.setTableName(table);
    proto.setSchemaName(schema);

    return ColumnIdentifier(proto);
};

module.exports = ColumnIdentifier;
