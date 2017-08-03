/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

'use strict';

const Client = require('../Protocol/Client');
const Result = require('./Result');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');

/**
 * CollectionAdd factory.
 * @module CollectionAdd
 */

/**
 * @private
 * @alias module:CollectionAdd
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} collection - collection name
 * @param {Object} documents - documents to add
 * @returns {CollectionAdd}
 */
function CollectionAdd (session, schema, collection, documents, options) {
    let state = { session, schema, collection, documents: documents || [], options: Object.assign({}, { upsert: false }, options) };

    return {
        /**
         * Run the query to save the documents to the collection in the database.
         * If a document does not contain an <code>_id</code>, it will be assigned a UUID-like value.
         * @function
         * @name module:CollectionAdd#execute
         * @tutorial Working_with_Documents
         * @returns {Promise.<Result>}
         */
        execute () {
            if (!state.documents.length) {
                return Promise.resolve();
            }

            const docs = state.documents.map(doc => {
                if (typeof doc._id !== 'undefined') {
                    return Object.assign({}, doc);
                }

                return Object.assign({}, doc, { _id: state.session.idGenerator() });
            });

            return state
                .session
                ._client
                .crudInsert(state.schema.getName(), state.collection, Client.dataModel.DOCUMENT, { rows: docs.map(doc => [JSON.stringify(doc)]) }, state.options)
                .then(state => new Result(Object.assign({}, state, { doc_ids: docs.map(doc => doc._id) })));
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
         * @returns {CollectionAdd} The operation instance.
         */
        add () {
            const documents = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            state.documents = state.documents.concat(documents);

            return this;
        },
        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:CollectionAdd#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionAdd';
        },

        /**
         * Retrieve the documents scheduled to be added.
         * @function
         * @name module:CollectionAdd#getDocuments
         * @returns {Object} The set of documents.
         */
        getDocuments () {
            return state.documents;
        }
    };
}

module.exports = CollectionAdd;
