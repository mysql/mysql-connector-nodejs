/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
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

const inserting = require('./Inserting');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const result = require('./Result');
const query = require('./Query');

/**
 * CollectionAdd factory.
 * @module CollectionAdd
 * @mixes Inserting
 * @mixes Query
 */

/**
 * @typedef {Object} CollectionAddOptions
 * @prop {boolean} upsert - upsert query
 */

/**
 * @private
 * @alias module:CollectionAdd
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableName - collection name
 * @param {Object[]} documents - list of documents to add
 * @param {CollectionAddOptions} options - additional options
 * @returns {module:CollectionAdd}
 */
function CollectionAdd (session, schema, tableName, documents, options) {
    documents = documents || [];
    session = session || {};

    return Object.assign({}, inserting(options), query({ schema, session, tableName }), {
        /**
         * Run the query to save the documents to the collection in the database.
         * If a document does not contain an <code>_id</code>, it will be assigned a UUID-like value.
         * @function
         * @name module:CollectionAdd#execute
         * @tutorial Working_with_Documents
         * @returns {Promise.<module:Result>}
         */
        execute () {
            if (!this.getItems().length) {
                return Promise.resolve();
            }

            return this.getSession()._client.crudInsert(this)
                .then(details => result(details));
        },

        /**
         * Create query to add one or various documents.
         * @function
         * @name module:CollectionAdd#add
         * @param {...Object|Object[]} input - document or list of documents
         * @throws {Error} When the input type is invalid.
         * @example
         * // arguments as single documents
         * collection.add({ foo: 'baz' }).add({ bar: 'qux' }, { biz: 'quux' })
         *
         * // array of documents
         * collection.add([{ foo: 'baz' }]).add([{ bar: 'qux' }, { biz: 'quux' }])
         * @returns {module:CollectionAdd} The query instance.
         */
        add () {
            return this.setItems(this.getItems().concat(parseFlexibleParamList(Array.prototype.slice.call(arguments))));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:CollectionAdd#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionAdd';
        }

    }).add(documents);
}

module.exports = CollectionAdd;
