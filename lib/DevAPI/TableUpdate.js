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

const { UpdateType } = require('../Protocol/Stubs/mysqlx_crud_pb').UpdateOperation;
const Binding = require('./Binding');
const ExprOrLiteral = require('./ExprOrLiteral');
const Filtering = require('./TableFiltering');
const Limiting = require('./Limiting');
const Ordering = require('./TableOrdering');
const Preparing = require('./Preparing');
const Query = require('./Query');
const Result = require('./Result');
const TableField = require('./TableField');
const Updating = require('./Updating');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const errors = require('../constants/errors');
const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.UPDATE;

/**
 * Factory function that creates an instance of a statement to update
 * records in a table.
 * @module TableUpdate
 * @mixes Binding
 * @mixes Limiting
 * @mixes TableFiltering
 * @mixes TableOrdering
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableupdatefunction|TableUpdateFunction}
 */

/**
 * @private
 * @alias module:TableUpdate
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {ExpressionTree[]} [operationList] - A list containing object
 * representations of X DevAPI update operation instances, which
 * establish how each row will be updated.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The name of the table where the statement is
 * being executed.
 * @returns {module:TableUpdate}
 */
function TableUpdate ({ connection, operationList = [], schema, tableName } = {}) {
    // A TableUpdate statement can be prepared, so it needs to provide
    // the appropriate capabilities and API.
    let preparable = Preparing({ connection });

    // The TableUpdate API is composed of multiple mixins that, each one,
    // introduce specific aspects and capabilities of the statement.
    preparable = {
        ...Binding(),
        ...Filtering({ preparable }),
        ...Limiting({ preparable }),
        ...Ordering({ preparable }),
        ...Query({ category: dataModel, schema, tableName, type }),
        ...Updating({ operationList }),
        ...preparable
    };

    // The TableUpdate API also introduces its own specific API.
    return {
        ...preparable,

        /**
         * Executes the statement in the database that updates all records
         * in the table that match the given criteria.
         * @function
         * @name module:TableUpdate#execute
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

            const fn = () => connection.getClient().crudModify(this);

            return preparable.execute(fn)
                .then(details => Result(details));
        },

        /**
         * Registers an update operation that updates a single field of all
         * documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:TableUpdate#set
         * @param {TableField} tableField - The name of the column to update.
         * @param {ExprOrLiteral} exprOrLiteral - A new value to assign to the
         * field.
         * @returns {module:TableUpdate} The instance of the statement itself
         * following a fluent API convention.
         */
        set (tableField, exprOrLiteral) {
            preparable.forceRestart();

            const valueToAssign = ExprOrLiteral({ value: exprOrLiteral, dataModel });

            operationList.push({
                type: UpdateType.SET,
                source: TableField(tableField).getValue(),
                value: valueToAssign.getValue(),
                isLiteral: valueToAssign.isLiteral()
            });

            return this;
        }
    };
}

module.exports = TableUpdate;
