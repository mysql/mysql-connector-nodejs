/*
 * Copyright (c) 2015, 2022, Oracle and/or its affiliates.
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

const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.DOCUMENT;
const DocumentOrJSON = require('./DocumentOrJSON');
const Result = require('./Result');

/**
 * Factory function that creates an instance of a statement for adding
 * documents to a collection.
 * @module CollectionAdd
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionaddfunction|CollectionAddFunction}
 */

/**
 * @private
 * @alias module:CollectionAdd
 * @param {module:Connection} connection - Instance of the current database
 * connection.
 * @param {module:Schema} schema - Instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - Name of the table where the statement is
 * being executed.
 * @param {boolean} upsert - replace document if it already exists
 * @returns {module:CollectionAdd}
 */
function CollectionAdd ({ connection, rows = [], schema, tableName, upsert = false } = {}) {
    return {
        /**
         * Executes the statement in the database that adds the current list
         * of documents to a collection.
         * If a document does not contain an <code>_id</code> field, one will
         * be auto-generated and assigned an UUID-like value.
         * @function
         * @name module:CollectionAdd#execute
         * @tutorial Working_with_Documents
         * @returns {Promise.<module:Result>} An object containing the details
         * reported by the server.
         */
        execute () {
            if (!rows.length) {
                return Promise.resolve();
            }

            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            const integerType = connection.getIntegerType();
            const statement = {
                dataModel,
                rows,
                schemaName: schema.getName(),
                tableName,
                upsert
            };

            return connection.getClient().crudInsert(statement)
                .then(details => Result({ ...details, integerType }));
        },

        /**
         * Adds one or more items to the list of documents that the statement
         * will add to the collection.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:CollectionAdd#add
         * @param {...DocumentOrJSON|DocumentOrJSON[]} documentsOrJSON - document or list of documents
         * @example
         * // arguments as single documents
         * collection.add({ foo: 'baz' }).add({ bar: 'qux' }, { biz: 'quux' })
         *
         * // array of documents
         * collection.add([{ foo: 'baz' }]).add([{ bar: 'qux' }, { biz: 'quux' }])
         * @returns {module:CollectionAdd} The instance of the statement itself
         * following a fluent API convention.
         */
        add (...documentsOrJSON) {
            documentsOrJSON.flat().forEach(d => {
                const documentToAdd = DocumentOrJSON(d);

                rows.push({ value: documentToAdd.getValue(), isLiteral: documentToAdd.isLiteral() });
            });

            return this;
        }
    };
}

module.exports = CollectionAdd;
