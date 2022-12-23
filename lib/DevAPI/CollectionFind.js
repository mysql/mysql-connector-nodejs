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
const Filtering = require('./Filtering');
const Grouping = require('./Grouping');
const Locking = require('./Locking');
const Ordering = require('./CollectionOrdering');
const Preparing = require('./Preparing');
const Projecting = require('./Projecting');
const ProjectedDocumentExprStr = require('./ProjectedDocumentExprStr');
const Query = require('./Query');
const Result = require('./DocResult');
const Skipping = require('./Skipping');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.DOCUMENT;

const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.FIND;

/**
 * Factory function that creates an instance of a statement to search
 * for documents in a collection.
 * @module CollectionFind
 * @mixes Binding
 * @mixes Grouping
 * @mixes Skipping
 * @mixes Locking
 * @mixes CollectionOrdering
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionfindfunction|CollectionFindFunction}
 */

/**
 * @private
 * @alias module:CollectionFind
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {ExpressionTree} [criteria] - An object representation of an X
 * DevAPI expression instance that establishes the criteria to use when
 * searching for documents in the collection.
 * @param {ExpressionTree[]} [projectionList] - A list containing object
 * representations of X DevAPI projected expression instances, which
 * establish the field names and aliases to include in the result set
 * when searching for documents in the collection.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The name of the table where the statement is
 * being executed.
 * @returns {module:CollectionFind}
 */
function CollectionFind ({ connection, criteria, projectionList = [], schema, tableName } = {}) {
    // A CollectionFind statement can be prepared, so it needs to provide
    // the appropriate capabilities and API.
    let preparable = Preparing({ connection });

    // The CollectionFind API is composed of multiple mixins that, each one,
    // introduce specific aspects and capabilities of the statement.
    preparable = {
        ...Binding(),
        ...Filtering({ constraints: { criteria } }),
        ...Ordering({ preparable }),
        ...Grouping({ dataModel, preparable }),
        ...Locking({ preparable }),
        ...Projecting({ projectionList }),
        ...Query({ schema, tableName, type }),
        ...Skipping({ preparable }),
        ...preparable
    };

    // The CollectionFind API also introduces its own specific API.
    return {
        ...preparable,
        /**
         * Selects one or more document fields to be part of the result set.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionFind#fields
         * @param {...ProjectedDocumentsExprStr} projectedDocumentsExprStr -
         * One or more field names and aliases or computed projection
         * expressions.
         * @returns {module:CollectionFind} The instance of the statement itself
         * following a fluent API convention.
         */
        fields (...projectedDocumentsExprStr) {
            preparable.forceRestart();

            projectedDocumentsExprStr.flat().forEach(projectedDocumentExprStr => {
                projectionList.push(ProjectedDocumentExprStr(projectedDocumentExprStr).getValue());
            });

            return this;
        },

        /**
         * Push-based cursor type used to iterate over documents in a result
         * set returned when searching in a collection.
         * @callback module:CollectionFind~documentCursor
         * @param {Object} object - Plain JavaScript object, in the current
         * cursor position, that represents a local instance of the
         * corresponding document.
         */

        /**
         * Executes the statement in the database that searches for all
         * documents in the collection that match the given criteria.
         * If a push-based cursor is provided, it should be used to iterate
         * over the documents in result set.
         * @function
         * @name module:CollectionFind#execute
         * @param {module:CollectionFind~documentCursor} [dataCursor] -
         * Callback function that works as push-based cursor to iterate over
         * the result set.
         * @return {Promise.<module:DocResult>} <code>Promise</code> that
         * resolves to an object containing the result set returned by the
         * statement and any other detail reported by the server. If a
         * push-based cursor is provided, the result set will be empty.
         */
        execute (dataCursor) {
            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            const integerType = connection.getIntegerType();
            // In DOCUMENT mode, the result set is composed by the content of
            // a single JSON column, which are available as a plain JavaScript
            // object in the first index of the row list.
            const cursor = dataCursor ? row => dataCursor(row?.toArray({ integerType })[0]) : undefined;
            const fn = () => connection.getClient().crudFind(this, cursor);

            return preparable.execute(fn, cursor)
                .then(details => Result({ ...details, integerType }));
        }
    };
}

module.exports = CollectionFind;
