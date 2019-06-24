/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
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

const collectionAdd = require('./CollectionAdd');
const collectionFind = require('./CollectionFind');
const collectionModify = require('./CollectionModify');
const collectionRemove = require('./CollectionRemove');
const databaseObject = require('./DatabaseObject');
const escapeQuotes = require('./Util/escapeQuotes');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const sqlExecute = require('./SqlExecute');
const table = require('./Table');

/**
 * Collection factory.
 * @module Collection
 * @mixes DatabaseObject
 */

/**
 * @private
 * @alias module:Collection
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} name - collection name
 * @returns {module:Collection}
 */
function Collection (session, schema, name) {
    const state = Object.assign({}, { name, schema });

    const collection = Object.assign({}, databaseObject(session), {
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
         * @returns {module:CollectionAdd} The operation instance.
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
         * @returns {Promise.<module:Result>} A promise that resolves to the operation result.
         */
        addOrReplaceOne (id, data) {
            const doc = Object.assign({}, data, { _id: escapeQuotes(id) });

            return collectionAdd(this.getSession(), this.getSchema(), this.getName(), [doc], { upsert: true }).execute();
        },

        /**
         * Retrieve the total number of documents in the collection.
         * @function
         * @name module:Collection#count
         * @returns {Promise.<number>}
         */
        count: function () {
            const schema = table.escapeIdentifier(this.getSchema().getName());
            const collection = table.escapeIdentifier(this.getName());

            let count = 0;
            let callback = row => { count = row[0]; };

            return sqlExecute(this.getSession(), `SELECT COUNT(*) FROM ${schema}.${collection}`)
                .execute(callback)
                .then(() => count)
                .catch(err => {
                    // TODO(Rui): Maybe this will become the job of the plugin at some point.
                    err.message = err.message.replace('Table', 'Collection').replace('table', 'collection');
                    throw err;
                });
        },

        /**
         * Check if this collection exists in the database.
         * @function
         * @name module:Collection#existsInDatabase
         * @returns {Promise.<boolean>}
         */
        // TODO(Rui): extract method into a proper aspect (to be used on Collection, Schema and Table).
        existsInDatabase () {
            const args = [{ schema: this.getSchema().getName(), filter: this.getName() }];

            let collections = [];
            let callback = found => { collections = collections.concat(found[0].toString()); };

            return sqlExecute(this.getSession(), 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute(callback)
                .then(() => {
                    return collections.indexOf(this.getName()) > -1;
                });
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
         * @returns {module:CollectionFind} The operation instance.
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
         * Retrieve the schema associated to the collection.
         * @function
         * @name module:Collection#getSchema
         * @returns {module:Schema}
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
         * collection.modify('name = "foo"').set('name', 'bar')
         * @returns {module:CollectionModify} The operation instance.
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
         * collection.remove('name = "foobar"')
         * @returns {module:CollectionRemove} The operation instance.
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
         * @returns {Promise.<module:Result>} A promise that resolves to the operation result.
         */
        removeOne (id) {
            return this.remove(`_id = "${escapeQuotes(id)}"`).execute();
        },

        /**
         * Replace an entire document with a given id.
         * @function
         * @name module:Collection#replaceOne
         * @param {string} id - document id
         * @param {Object} data - document properties
         * @example
         * collection.replaceOne('foo', { prop1: 'bar', prop2: 'baz' })
         * @returns {Promise.<module:Result>} A promise that resolves to the operation result.
         */
        replaceOne (id, data) {
            return this.modify(`_id = "${escapeQuotes(id)}"`).set('$', data).execute();
        },

        /**
         * Drop an Index on a Collection given a name.
         * @function
         * @name module:Collection#dropIndex
         * @param {string} name - Index name
         * @returns {Promise.<boolean>}
         */
        dropIndex (name) {
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error('Invalid index name.'));
            }

            const args = [{
                name: name,
                schema: this.getSchema().getName(),
                collection: this.getName()
            }];

            return sqlExecute(this.getSession(), 'drop_collection_index', args, sqlExecute.Namespace.X_PLUGIN).execute()
                .then(() => true)
                .catch(err => {
                    if (!err.info || err.info.code !== 1091) {
                        throw err;
                    }

                    return false;
                });
        },

        /**
         * Index field definition.
         *
         * @typedef {Object} FieldDefinition
         * @prop {string} field - document path
         * @prop {string} type - index type (see example)
         * @prop {boolean} [required=false] - allow (or not) `null` values for the column
         * @prop {number} [options] - describes how to handle GeoJSON documents that contain geometries with coordinate dimensions higher than 2
         * @prop {number} [srid] - unique value used to unambiguously identify projected, unprojected, and local spatial coordinate system definitions.
         *
         * @example
         * INT [UNSIGNED]
         * TINYINT [UNSIGNED]
         * SMALLINT [UNSIGNED]
         * MEDIUMINT [UNSIGNED]
         * INTEGER [UNSIGNED]
         * BIGINT [UNSIGNED]
         * REAL [UNSIGNED]
         * FLOAT [UNSIGNED]
         * DOUBLE [UNSIGNED]
         * DECIMAL [UNSIGNED]
         * NUMERIC [UNSIGNED]
         * DATE
         * TIME
         * TIMESTAMP
         * DATETIME
         * TEXT[(length)]
         * GEOJSON (extra options: options, srid)
         */

        /**
         * Index overall definition.
         *
         * @typedef {Object} IndexDefinition
         * @prop {string} [type=INDEX] - index type (INDEX or SPATIAL).
         * @prop {FieldDefinition[]} fields - index field definitions
         */

        /**
         * Create a new index.
         * @function
         * @name module:Collection#createIndex
         * @param {string} name - index name
         * @param {IndexDefinition} constraint - index definition
         * @returns {Promise.<boolean>}
         */
        createIndex (name, constraint) {
            constraint = Object.assign({ fields: [] }, constraint);
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error('Invalid index name.'));
            }

            const isValidDefinition = Array.isArray(constraint.fields) && constraint.fields.length && constraint.fields.every((field) => {
                return typeof field.field === 'string' && typeof field.type === 'string';
            });

            if (!isValidDefinition) {
                return Promise.reject(new Error('Invalid index definition.'));
            }

            if (constraint.unique === true) {
                return Promise.reject(new Error('Unique indexes are currently not supported.'));
            }

            const args = [{
                name: name,
                schema: this.getSchema().getName(),
                collection: this.getName(),
                unique: false,
                type: constraint.type || 'INDEX',
                constraint: constraint.fields.map(item => {
                    // 'field' property is renamed to 'member' to avoid an x-plugin incompatibility.
                    let data = Object.assign({ array: item.array || false, member: item.field, required: false }, item);
                    delete data.field;

                    return data;
                })
            }];

            return sqlExecute(this.getSession(), 'create_collection_index', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => true);
        }
    });

    // Building the operation once avoids to parse the same expression over and over again
    // and at the same time allows it to take advantage of server-side prepared statements.
    const findOne = collection.find(`_id = :id`);

    const extendedCollection = Object.assign({}, collection, {
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
            let instance = null;

            return findOne.bind('id', id)
                .execute(doc => {
                    instance = doc;
                })
                .then(() => instance);
        }
    });

    return extendedCollection;
}

module.exports = Collection;
