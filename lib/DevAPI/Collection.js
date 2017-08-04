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

const collectionAdd = require('./CollectionAdd');
const collectionFind = require('./CollectionFind');
const collectionModify = require('./CollectionModify');
const collectionRemove = require('./CollectionRemove');
const databaseObject = require('./DatabaseObject');
const linking = require('./Linking');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const table = require('./Table');
const escapeQuotes = require('./Util/escapeQuotes');

/**
 * Collection factory.
 * @module Collection
 * @mixes DatabaseObject
 * @mixes Linking
 */

/**
 * @private
 * @alias module:Collection
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} name - collection name
 * @param {string} alias - collection alias
 * @param {Object} links - collection join links
 * @returns {Collection}
 */
function Collection (session, schema, name, alias, links) {
    const state = Object.assign({}, { links: {} }, { alias, links, name, schema });

    return Object.assign({}, databaseObject(session), linking(), {
        /**
         * Literal object or JSON counterpart.
         * @typedef {Object|string} DocumentOrJSON
         * @global
         * @example
         * // literal object
         * { foo: 'bar' }
         * // JSON string
         * '{ "foo": "bar" }'
         */

        /**
         * Create an operation to add one or more documents to the collection.
         * @function
         * @name module:Collection#add
         * @param {...DocumentOrJSON|DocumentOrJSON[]} expr - object with document data
         * @throws {Error} When the input type is invalid.
         * @example
         * // arguments as single documents
         * collection.add({ foo: 'baz' }, { bar: 'qux' })
         *
         * // array of documents
         * collection.add([{ foo: 'baz' }, { bar: 'qux' }])
         * @returns {CollectionAdd} The operation instance.
         */
        add () {
            const documents = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            return collectionAdd(this.getSession(), this.getSchema(), this.getName(), documents);
        },

        /**
         * Create or replace a document with the given id.
         * @function
         * @name module:Collection#addOrReplaceOne
         * @param {string} id - document id
         * @param {Object} data - document properties
         * @example
         * collection.addOrReplaceOne('foo', { prop1: 'bar', prop2: 'baz' })
         * @returns {Promise.<Result>} A promise that resolves to the operation result.
         */
        addOrReplaceOne (id, data) {
            const doc = Object.assign({}, data, { _id: id });

            return collectionAdd(this.getSession(), this.getSchema(), this.getName(), [doc], { upsert: true }).execute();
        },

        /**
         * Set alias for a linking operation using the collection.
         * @function
         * @name module:Collection#as
         * @param {string} alias - new collection alias
         * @returns {Collection} The entity instance.
         */
        as (alias) {
            return Collection(this.getSession(), this.getSchema(), this.getName(), alias, this.getLinks());
        },

        /**
         * Retrieve the total number of documents in the collection.
         * @function
         * @name module:Table#count
         * @returns {Promise.<number>}
         */
        // TODO(Rui): extract method into a proper aspect (to be used on Collection and Table).
        count () {
            const schema = table.escapeIdentifier(this.getSchema().getName());
            const collection = table.escapeIdentifier(this.getName());

            let count = 0;

            return this
                .getSession()
                ._client
                .sqlStmtExecute(`SELECT COUNT(*) FROM ${schema}.${collection}`, [], row => { count = row[0]; })
                .then(() => count);
        },

        /**
         * Check if this collection exists in the database.
         * @function
         * @name module:Collection#existsInDatabase
         * @returns {Promise.<boolean>}
         */
        // TODO(Rui): extract method into a proper aspect (to be used on Collection, Schema and Table).
        existsInDatabase () {
            const args = [this.getSchema().getName(), this.getName()];
            let status = false;

            return this
                .getSession()
                ._client
                .sqlStmtExecute('list_objects', args, (found) => { status = !!found.length; }, null, 'xplugin')
                .then(() => status);
        },

        /**
         * Expression that establishes the filtering criteria.
         * @typedef {string} SearchConditionStr
         * @global
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html|X DevAPI User Guide}
         */

        /**
         * Create an operation to find documents in the collection.
         * @function
         * @name module:Collection#find
         * @param {SearchConditionStr} expr - filtering criteria
         * @returns {CollectionFind} The operation instance.
         */
        find (expr) {
            return collectionFind(this.getSession(), this.getSchema(), this.getName(), expr);
        },

        /**
         * Retrieve the collection name.
         * @function
         * @name module:Collection#getName
         * @returns {string}
         */
        getName () {
            return state.name;
        },

        /**
         * Retrieve a single document with the given id.
         * @function
         * @name module:Collection#getOne
         * @param {string} id - document id
         * @example
         * collection.getOne('1')
         * @returns {Object} The document instance.
         */
        getOne (id) {
            let instance;

            return this
                .find(`$._id == "${escapeQuotes(id)}"`)
                .execute(doc => {
                    instance = doc || null;
                })
                .then(() => instance);
        },

        /**
         * Retrieve the schema associated to the collection.
         * @function
         * @name module:Collection#getSchema
         * @returns {Schema}
         */
        getSchema () {
            return state.schema;
        },

        /**
         * Retrieve the collection metadata.
         * @function
         * @name module:Collection#inspect
         * @returns {Object} An object containing the relevant metadata.
         */
        inspect () {
            return { schema: this.getSchema().getName(), collection: this.getName() };
        },

        /**
         * Create an operation to modify documents in the collection.
         * @function
         * @name module:Collection#modify
         * @param {SearchConditionStr} expr - filtering criteria
         * @example
         * // update all documents in a collection
         * collection.modify('true').set('name', 'bar')
         *
         * // update documents that match a given condition
         * collection.modify('$.name == "foo"').set('name', 'bar')
         * @returns {CollectionModify} The operation instance.
         */
        modify (expr) {
            return collectionModify(this.getSession(), this.getSchema(), this.getName(), expr);
        },

        /**
         * Create an operation to remove documents from the collection.
         * @function
         * @name module:Collection#remove
         * @param {SearchConditionStr} expr - filtering criteria
         * @example
         * // remove all documents from a collection
         * collection.remove('true')
         *
         * // remove documents that match a given condition
         * collection.remove('$.name == "foobar"')
         * @returns {CollectionRemove} The operation instance.
         */
        remove (expr) {
            return collectionRemove(this.getSession(), this.getSchema(), this.getName(), expr);
        },

        /**
         * Remove a single document with the given id.
         * @function
         * @name module:Collection#removeOne
         * @param {string} id - document id
         * @example
         * collection.removeOne('1')
         * @returns {Promise.<Result>} A promise that resolves to the operation result.
         */
        removeOne (id) {
            return this.remove(`$._id == "${escapeQuotes(id)}"`).execute();
        },

        /**
         * Replace an entire document with a given id.
         * @function
         * @name module:Collection#replaceOne
         * @param {string} id - document id
         * @param {Object} data - document properties
         * @example
         * collection.replaceOne('foo', { prop1: 'bar', prop2: 'baz' })
         * @returns {Promise.<Result>} A promise that resolves to the operation result.
         */
        replaceOne (id, data) {
            const docs = [];

            // TODO(Rui): all this can be boiled down to the following, as soon as the expression parser is replaced
            // return this.modify(`$._id == "${escapeQuotes(id)}"`).set('$', data).execute()
            return this
                .find(`$._id == "${escapeQuotes(id)}"`)
                .execute(doc => doc && docs.push(doc))
                .then(() => {
                    const query = this.modify(`$._id == "${escapeQuotes(id)}"`);

                    if (docs.length) {
                        const toReplace = Object.keys(docs[0])
                            .filter(key => key !== `_id`)
                            .map(key => `$.${key}`);

                        query.unset(toReplace);
                    }

                    Object.keys(data).forEach(key => {
                        if (key === `_id`) {
                            return;
                        }

                        query.set(`$.${key}`, data[key]);
                    });

                    return query.execute();
                });
        }
    });
}

module.exports = Collection;
