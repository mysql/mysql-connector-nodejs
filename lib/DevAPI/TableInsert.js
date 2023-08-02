/*
 * Copyright (c) 2015, 2023, Oracle and/or its affiliates.
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

const ExprOrLiteral = require('./ExprOrLiteral');
const Result = require('./Result');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;

/**
 * Factory function that creates an instance of a statement for inserting
 * rows into a table.
 * @module TableInsert
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableinsertfunction|TableInsertFunction}
 */

/**
 * @private
 * @alias module:TableInsert
 * @param {string[]} [columns] - A list of names of columns in which the
 * values will be inserted.
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {Array<*>} [rows] - A list of values to insert in the selected
 * columns.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The name of the table where the statement is
 * being executed.
 * @returns {module:TableInsert}
 */
function TableInsert ({ columns = [], connection, rows = [], schema, tableName } = {}) {
    return {
        /**
         * Executes the statement in the database that inserts the given
         * records in the database.
         * @function
         * @name module:TableUpdate#execute
         * @return {Promise.<module:Result>} A <code>Promise</code> that
         * resolves to an object containing the details reported by the server.
         */
        execute () {
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
                columns,
                rows,
                schemaName: schema.getName(),
                tableName
            };

            return connection.getClient().crudInsert(statement)
                .then(details => Result({ ...details, integerType }));
        },

        /**
         * Adds one or more values, given the corresponding list of columns,
         * which the statement will insert in the table.
         * @function
         * @name module:TableInsert#values
         * @param {...*} literal - One or more values to insert in the
         * corresponding columns.
         * @example
         * // arguments as column values
         * table.insert('foo', 'bar').values('baz', 'qux')
         * table.insert(['foo', 'bar']).values('baz', 'qux')
         *
         * // array of column values
         * table.insert('foo', 'bar').values(['baz', 'qux'])
         * table.insert(['foo', 'bar']).values(['baz', 'qux'])
         *
         * // comma-separated string with column values
         * table.insert('foo', 'bar').values('baz, qux'])
         * table.insert(['foo', 'bar']).values('baz, qux')
         *
         * // chaining multiple inserts
         * table.insert('foo', 'bar')
         *      .values(['baz', 'qux'])
         *      .values(['quux', 'biz'])
         *      .values('foo, bar')
         * @returns {module:TableInsert} The Instance of the statement itself
         * following a fluent API convention.
         */
        values (...exprOrLiteral) {
            rows.push(exprOrLiteral.flat().map(value => {
                const valueToInsert = ExprOrLiteral({ value, dataModel });

                return { value: valueToInsert.getValue(), isLiteral: valueToInsert.isLiteral() };
            }));

            return this;
        }
    };
}

module.exports = TableInsert;
