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

const Binding = require('./Binding');
const ColumnWrapper = require('./Util/columnWrapper');
const Filtering = require('./TableFiltering');
const Grouping = require('./Grouping');
const Locking = require('./Locking');
const Preparing = require('./Preparing');
const Projecting = require('./Projecting');
const Query = require('./Query');
const Result = require('./RowResult');
const Skipping = require('./Skipping');
const Ordering = require('./TableOrdering');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;

/**
 * Factory function that creates an instance of a statement to search
 * for records in a table.
 * @module TableSelect
 * @mixes Binding
 * @mixes Grouping
 * @mixes Locking
 * @mixes Skipping
 * @mixes TableFiltering
 * @mixes TableOrdering
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableselectfunction|TableSelectFunction}
 */

/**
 * @private
 * @alias module:TableSelect
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {ExpressionTree[]} [projectionList] - A list containing object
 * representations of X DevAPI projected expression instances, which
 * establish the column names and aliases to include in the result set
 * when searching for records in the table.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The name of the table where the statement is
 * being executed.
 * @returns {module:TableSelect}
 */
function TableSelect ({ connection, projectionList = [], schema, tableName } = {}) {
    // A TableSelect statement can be prepared, so it needs to provide
    // the appropriate capabilities and API.
    let preparable = Preparing({ connection });

    // The TableSelect API is composed of multiple mixins that, each one,
    // introduce specific aspects and capabilities of the statement.
    preparable = {
        ...Binding(),
        ...Filtering({ preparable }),
        ...Grouping({ dataModel, preparable }),
        ...Locking({ preparable }),
        ...Ordering({ preparable }),
        ...Projecting({ projectionList }),
        ...Query({ category: dataModel, schema, tableName }),
        ...Skipping({ preparable }),
        ...preparable
    };

    // The TableSelect API also introduces its own specific API.
    return {
        ...preparable,

        /**
         * Push-based cursor type used to iterate over rows in a result set
         * returned when searching for records in a table.
         * @callback module:TableSelect~rowCursor
         * @param {Array.<*>} items - The list of column values for the row in
         * the current cursor position.
         */

        /**
         * Push-based cursor type used to iterate over the column metadata in
         * a result set returned when searching for records in a table.
         * @callback module:TableSelect~metadataCursor
         * @param {Array.<Object>} metadata - The list of objects containing
         * metadata details for each column.
         */

        /**
         * Executes the statement in the database that searches for all
         * records in the table that match the given criteria.
         * If a push-based cursor is provided, it should be used to iterate
         * over the rows in result set. Additionally, if a metadata cursor
         * is also provided, it should be used to iterate over each column
         * definition.
         * @function
         * @name module:TableSelect#execute
         * @param {module:TableSelect~rowCursor} [dataCursor] - Callback
         * function that works as push-based cursor to iterate over the result
         * set.
         * @param {module:TableSelect~metadataCursor} [metadataCursor] -
         * Callback function that works as push-based cursor to iterate over
         * each column that contains values in the result set.
         * @return {Promise.<module:RowResult>} A <code>Promise</code> that
         * resolves to an object containing the result set returned by the
         * statement and any other detail reported by the server. If a
         * push-based cursor is provided, the result set will be empty.
         */
        execute (dataCursor, metadataCursor) {
            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            const integerType = connection.getIntegerType();
            // In DOCUMENT mode, the result set is composed by the values of
            // every projected column, which are available as a JavaScript
            // array that corresponds to the row list.
            const cursor = dataCursor ? row => dataCursor(row?.toArray({ integerType })) : undefined;
            const fn = () => connection.getClient().crudFind(this, cursor, ColumnWrapper(metadataCursor));

            return preparable.execute(fn, cursor, ColumnWrapper(metadataCursor))
                .then(details => Result({ ...details, integerType }));
        }
    };
}

module.exports = TableSelect;
