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
const DocPath = require('./DocPath');
const DocumentOrJSON = require('./DocumentOrJSON');
const ExprOrLiteral = require('./ExprOrLiteral');
const Filtering = require('./Filtering');
const Limiting = require('./Limiting');
const Ordering = require('./CollectionOrdering');
const Preparing = require('./Preparing');
const Query = require('./Query');
const Result = require('./Result');
const Updating = require('./Updating');
const errors = require('../constants/errors');
const logger = require('../logger');
const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.UPDATE;
const util = require('util');
const warnings = require('../constants/warnings');

const log = logger('api:collection:modify');

/**
 * Factory function that creates an instance of a statement to modify
 * one or more documents in a collection.
 * @module CollectionModify
 * @mixes Binding
 * @mixes CollectionOrdering
 * @mixes Limiting
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionmodifyfunction|CollectionModifyFunction}
 */

/**
 * @private
 * @alias module:CollectionModify
 * @param {module:Connection} connection - The instance of the current
 * database connection.
 * @param {ExpressionTree} criteria - An object representation of an X
 * DevAPI expression instance that establishes the criteria to use when
 * searching for documents in the collection.
 * @param {module:Schema} schema - The instance of the schema where the
 * statement is being executed.
 * @param {string} tableName - The Name of the table where the statement is
 * being executed.
 * @returns {module:CollectionModify}
 */
function CollectionModify ({ connection, criteria, operationList = [], schema, tableName } = {}) {
    // A CollectionModify statement can be prepared, so it needs to provide
    // the appropriate capabilities and API.
    let preparable = Preparing({ connection });

    // The CollectionModify API is composed of multiple mixins that, each one,
    // introduce specific aspects and capabilities of the statement.
    preparable = {
        ...Binding(),
        ...Filtering({ constraints: { criteria } }),
        ...Limiting({ preparable }),
        ...Ordering({ preparable }),
        ...Query({ schema, tableName, type }),
        ...Updating({ operationList }),
        ...preparable
    };

    // The CollectionModify API also introduces its own specific API.
    return {
        ...preparable,
        /**
         * Registers an update operation that appends a given element to
         * on array field on all documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#arrayAppend
         * @param {DocPath} docPath - The full path of the document field to
         * update.
         * @param {ExprOrLiteral} exprOrLiteral - A new value to assign to the
         * field.
         * @returns {module:CollectionModify} The instance of the statement
         * itself following a fluent API convention.
         */
        arrayAppend (docPath, exprOrLiteral) {
            preparable.forceRestart();

            const valueToAppend = ExprOrLiteral({ value: exprOrLiteral });

            operationList.push({
                type: UpdateType.ARRAY_APPEND,
                source: DocPath(docPath).getValue(),
                value: valueToAppend.getValue(),
                isLiteral: valueToAppend.isLiteral()
            });

            return this;
        },

        /**
         * Registers an update operation that deletes an array field from
         * all documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#arrayDelete
         * @param {DocPath} docPath - The full path of the document field to
         * update.
         * @returns {module:CollectionModify} The Instance of the statement
         * itself following a fluent API convention.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         * Use {@link module:CollectionModify#unset|CollectionModify.unset()}
         * instead.
         */
        arrayDelete (docPath) {
            log.warning('arrayDelete', warnings.MESSAGES.WARN_DEPRECATED_ARRAY_DELETE, {
                type: warnings.TYPES.DEPRECATION,
                code: warnings.CODES.DEPRECATION
            });

            return this.unset(docPath);
        },

        /**
         * Registers an update operation that inserts an element at given index
         * of an array field on all documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#arrayInsert
         * @param {DocPath} docPath - The full path of the document field
         * (including the array index) to update.
         * @param {ExprOrLiteral} exprOrLiteral - A new value to insert into
         * the array at the given index.
         * @returns {module:CollectionModify} The instance of the statement
         * itself following a fluent API convention.
         */
        arrayInsert (docPath, exprOrLiteral) {
            preparable.forceRestart();

            const valueToInsert = ExprOrLiteral({ value: exprOrLiteral });

            operationList.push({
                type: UpdateType.ARRAY_INSERT,
                source: DocPath(docPath).getValue(),
                value: valueToInsert.getValue(),
                isLiteral: valueToInsert.isLiteral()
            });

            return this;
        },

        /**
         * Executes the statement in the database that modifies all documents
         * in the collection that match the given criteria.
         * @function
         * @name module:CollectionModify#execute
         * @return {Promise.<module:Result>} A <code>Promise</code> that
         * resolves to an object containing the details reported by the server.
         */
        execute () {
            // An explicit criteria needs to be provided. This is to avoid
            // updating all documents in a collection by mistake.
            if (!this.getCriteria_()) {
                return Promise.reject(new Error(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'modify()')));
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
         * Registers an update operation that updates multiple fields of all
         * documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#patch
         * @param {DocumentOrJSON} documentOrJSON - Object containing the
         * fields and corresponding values to create, remove or update (diff)
         * in each document.
         * @return {module:CollectionModify} The instance of the statement itself
         * following a fluent API convention.
         */
        patch (documentOrJSON) {
            preparable.forceRestart();

            const documentDiff = DocumentOrJSON(documentOrJSON);

            operationList.push({
                type: UpdateType.MERGE_PATCH,
                source: DocPath('$').getValue(),
                value: documentDiff.getValue(),
                isLiteral: documentDiff.isLiteral()
            });

            return this;
        },

        /**
         * Registers an update operation that updates a single field of all
         * documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#set
         * @param {DocPath} docPath - The full path of the document field to
         * update.
         * @param {ExprOrLiteral} exprOrLiteral - A new value to assign to the
         * field.
         * @returns {module:CollectionModify} An instance of the statement itself
         * following a fluent API convention.
         */
        set (docPath, exprOrLiteral) {
            preparable.forceRestart();

            const valueToAssign = ExprOrLiteral({ value: exprOrLiteral });

            operationList.push({
                type: UpdateType.ITEM_SET,
                source: DocPath(docPath).getValue(),
                value: valueToAssign.getValue(),
                isLiteral: valueToAssign.isLiteral()
            });

            return this;
        },

        /**
         * Registers an update operation that removes one or more fields from
         * all documents that match the criteria.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name module:CollectionModify#unset
         * @param {...DocPaths} docPaths - One ore more paths of fields to
         * remove.
         * @returns {module:CollectionModify} The instance of the statement
         * itself following a fluent API convention.
         */
        unset (...docPaths) {
            preparable.forceRestart();

            docPaths.flat().forEach(docPath => {
                operationList.push({
                    type: UpdateType.ITEM_REMOVE,
                    source: DocPath(docPath).getValue()
                });
            });

            return this;
        }
    };
}

module.exports = CollectionModify;
