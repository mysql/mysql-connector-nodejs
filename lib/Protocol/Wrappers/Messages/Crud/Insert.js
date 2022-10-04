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

const InsertStub = require('../../../Stubs/mysqlx_crud_pb').Insert;
const collection = require('./Collection');
const column = require('./Column');
const list = require('../../Traits/List');
const polyglot = require('../../Traits/Polyglot');
const scalar = require('../Datatypes/Scalar');
const serializable = require('../../Traits/Serializable');
const typedRow = require('./TypedRow');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Crud.Insert
 * @param {proto.Mysqlx.Crud.Insert} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Crud.Insert}
 */
function Insert (proto) {
    return Object.assign({}, polyglot(proto), serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Crud.Insert#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                collection: collection(proto.getCollection()).toJSON(),
                data_model: this.getDataModel(),
                projection: list(proto.getProjectionList().map(c => column(c))).toJSON(),
                row: list(proto.getRowList().map(row => typedRow(row))).toJSON(),
                args: list(proto.getArgsList().map(arg => scalar(arg))).toJSON(),
                upsert: proto.getUpsert()
            };
        }
    });
}

/**
 * Creates a wrapper for a Mysqlx.Crud.Delete protobuf message given the
 * statement details.
 * @private
 * @param {Array<*>} [columns] - List of column names (only provided in
 * TABLE mode).
 * @param {DataModel} [dataModel] - Data model to use for creating the
 * statement type.
 * @param {Array<*>} [rows] - List of documents or arrays where each element
 * is the value of a column for a given row.
 * @param {string} schemaName - Name of the schema that holds the table or
 * collection in the database.
 * @param {string} tableName - Name of the table or collection.
 * @param {boolean} [upsert] - Determines if the statement corresponds to
 * an upsert or a regular insert. Used only when called via the
 * Collection.addOrReplaceOne() method.
 * @returns {module:adapters.Mysqlx.Crud.Insert}
 */
Insert.create = function ({ columns = [], dataModel, rows = [], schemaName, tableName, upsert = false }) {
    const proto = new InsertStub();

    proto.setCollection(collection.create({ name: tableName, schemaName }).valueOf());
    proto.setDataModel(dataModel);
    proto.setProjectionList(columns.map(c => column.create(c).valueOf()));
    proto.setRowList(rows.map(row => typedRow.create(row).valueOf()));
    proto.setUpsert(upsert);

    return Insert(proto);
};

module.exports = Insert;
