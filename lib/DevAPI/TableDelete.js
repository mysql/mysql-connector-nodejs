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
const Filtering = require('./TableFiltering');
const Limiting = require('./Limiting');
const Ordering = require('./TableOrdering');
const Preparing = require('./Preparing');
const Query = require('./Query');
const Result = require('./Result');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const errors = require('../constants/errors');
const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.DELETE;

/**
 * Factory function that creates an instance of a statement to delete
 * records from a table.
 * @module TableDelete
 * @mixes Binding
 * @mixes Limiting
 * @mixes TableFiltering
 * @mixes TableOrdering
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tabledeletefunction|TableDeleteFunction}
 */

/**
 * @private
 * @alias module:TableDelete
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The name of the table where the statement is
 * being executed.
 * @returns {module:TableDelete}
 */
function TableDelete ({ connection, schema, tableName } = {}) {
    // A TableDelete statement can be prepared, so it needs to provide
    // the appropriate capabilities and API.
    let preparable = Preparing({ connection });

    // The TableDelete API is composed of multiple mixins that, each one,
    // introduce specific aspects and capabilities of the statement.
    preparable = {
        ...Binding(),
        ...Filtering({ preparable }),
        ...Limiting({ preparable }),
        ...Query({ category: dataModel, schema, tableName, type }),
        ...Ordering({ preparable }),
        ...preparable
    };

    // The TableDelete API also introduces its own specific API.
    return {
        ...preparable,

        /**
         * Executes the statement in the database that removes all records
         * from the table that match the given criteria.
         * @function
         * @name module:TableDelete#execute
         * @return {Promise.<module:Result>} A <code>Promise</code> that
         * resolves to an object containing the details reported by the server.
         */
        execute () {
            // An explicit criteria needs to be provided. This is to avoid
            // updating all documents in a collection by mistake.
            if (!this.getCriteria_()) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_MISSING_TABLE_CRITERIA));
            }

            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            const fn = () => connection.getClient().crudRemove(this);

            return preparable.execute(fn)
                .then(details => Result(details));
        }
    };
}

module.exports = TableDelete;
