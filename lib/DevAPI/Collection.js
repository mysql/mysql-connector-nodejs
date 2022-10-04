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

const Expr = require('./Expr');
const collectionAdd = require('./CollectionAdd');
const collectionFind = require('./CollectionFind');
const collectionModify = require('./CollectionModify');
const collectionRemove = require('./CollectionRemove');
const DatabaseObject = require('./DatabaseObject');
const errors = require('../constants/errors');
const escapeQuotes = require('./Util/escapeQuotes');
const sqlExecute = require('./SqlExecute');
const table = require('./Table');

/**
 * Factory function that creates a DevAPI Collection instance. This instance
 * is used to create and/or execute various CRUD-like statements.
 * @module Collection
 * @mixes DatabaseObject
 * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html|Collection CRUD Functions}
 */

/**
 * @private
 * @alias module:Collection
 * @param {module:Connection} [connection] - The instance of the current
 * database connection.
 * @param {module:CollectionFind} [getOneStatement] - A potentially cached
 * CollectionFind statement which is prepared once and used every time the
 * "getOne" method is executed.
 * @param {module:CollectionRemove} [removeOneStatement] - A potentially cached
 * CollectionRemove statement which is prepared once and used every time the
 * "removeOne" method is executed.
 * @param {module:Schema} [schema] - The instance of the schema where statements
 * will be executed.
 * @param {string} [tableName] - The name of the underlying database table.
 * @returns {module:Collection}
 */
function Collection ({ connection, getOneStatement, removeOneStatement, replaceOneStatement, schema, tableName } = {}) {
    return {
        ...DatabaseObject(connection),

        /**
         * Creates a statement that adds one or more documents to the
         * collection.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Collection#add
         * @param {...DocumentsOrJSON} documentsOrJSON - One
         * or more plain JavaScript objects, JSON strings or X DevAPI
         * expressions that represent document definitions provided as an
         * array or as multiple arguments.
         * @example
         * // arguments as single documents
         * collection.add({ foo: 'baz' }, { bar: 'qux' })
         *
         * // array of documents
         * collection.add([{ foo: 'baz' }, { bar: 'qux' }])
         * @returns {module:CollectionAdd} A new instance of a statement
         * containing the documents which will be added to the collection.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionaddfunction|CollectionAddFunction}
         */
        add (...documentsOrJSON) {
            // Since each argument can be a single document or a list of
            // documents, the spread operator is used to wrap them in an array
            // which is then flattened.
            return collectionAdd({ connection, schema, tableName }).add(documentsOrJSON.flat());
        },

        /**
         * Creates a document with a given id and set of fields and values or
         * replace one if it already exists.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#addOrReplaceOne
         * @param {string} id - The id of the document.
         * @param {Object} data - An Object containing the document fields and
         * corresponding values.
         * @example
         * collection.addOrReplaceOne('foo', { prop1: 'bar', prop2: 'baz' })
         * @throws Object contains an <code>_id</code> field whose value is
         * different then the given document id from the first argument.
         * @returns {Promise<module:Result>} A <code>Promise</code> that resolves to
         * an object containing the details reported by the server.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-single-document-operations.html|Single Document Operations}
         */
        addOrReplaceOne (id, data = {}) {
            // If the reference id does not match a potential replacement
            // document id, the operation should be aborted.
            if (typeof data._id !== 'undefined' && data._id !== id) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH));
            }

            return collectionAdd({ connection, schema, tableName, upsert: true })
                .add({ ...data, _id: escapeQuotes(id) })
                .execute();
        },

        /**
         * Retrieves the total number of documents in the collection.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#count
         * @returns {Promise<number>} A <code>Promise</code> that resolves to
         * the number of documents in the collection.
         */
        count () {
            const schemaName = table.escapeIdentifier(schema.getName());
            const collection = table.escapeIdentifier(tableName);

            let count = 0;
            const callback = row => { count = row[0]; };

            return sqlExecute(connection, `SELECT COUNT(*) FROM ${schemaName}.${collection}`)
                .execute(callback)
                .then(() => count)
                .catch(err => {
                    // The server error message does not make the distinction
                    // between collections and tables, so we need to update it.
                    // Maybe this should become the job of the plugin at some
                    // point in the future.
                    const message = err.message.replace('Table', 'Collection').replace('table', 'collection');
                    err.message = err.info.msg = message;

                    throw err;
                });
        },

        /**
         * A field is identified by a given document path, has a given
         * datatype, is or is not required and can include geo-related options.
         * @typedef {Object} FieldDefinition
         * @prop {string} field - The full document path of the field.
         * @prop {string} type - The index datatype (see example).
         * @prop {boolean} [required=false] - Allow <code>NULL</code> column
         * values.
         * @prop {number} [options] - Describes how to handle GeoJSON documents
         * that contain geometries with coordinate dimensions higher than 2.
         * @prop {number} [srid] - Unique value used to unambiguously identify
         * projected, unprojected, and local spatial coordinate system
         * definitions.
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
         * A collection index has a given type and a specific set of
         * properties for each document field that is covered by the index.
         * @typedef {Object} IndexDefinition
         * @prop {string} [type=INDEX] - The index type (INDEX or SPATIAL).
         * @prop {FieldDefinition[]} fields - The list of definitions for each
         * of the index fields.
         */

        /**
         * Creates an index with the given name and properties in the
         * collection.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#createIndex
         * @param {string} name - The name of the index.
         * @param {IndexDefinition} constraint - An object containing the
         * index definition.
         * @throws Index name is not a valid string.
         * @throws Index definition does not include a valid field list.
         * @throws Index definition includes an empty field list.
         * @throws Index definition includes an invalid field.
         * @throws Index definition is a missing field.
         * @throws Index definition includes a field without a datatype.
         * @throws Index with the given name already exists.
         * @throws Index is supposed to ensure uniqueness.
         * @returns {Promise<boolean>} A <code>Promise</code> that always
         * resolves to <code>true</code>.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-indexing.html#collection-creating-index|Creating an Index}
         */
        createIndex (name, constraint) {
            constraint = Object.assign({ fields: [] }, constraint);
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_NAME));
            }

            const isValidDefinition = Array.isArray(constraint.fields) && constraint.fields.length && constraint.fields.every((field) => {
                return typeof field.field === 'string' && typeof field.type === 'string';
            });

            if (!isValidDefinition) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION));
            }

            if (constraint.unique === true) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_NO_UNIQUE_INDEX));
            }

            const args = [{
                name: name,
                schema: schema.getName(),
                collection: tableName,
                unique: false,
                type: constraint.type || 'INDEX',
                constraint: constraint.fields.map(item => {
                    // 'field' property is renamed to 'member' to avoid an x-plugin incompatibility.
                    const data = Object.assign({ array: item.array || false, member: item.field, required: false }, item);
                    delete data.field;

                    return data;
                })
            }];

            return sqlExecute(connection, 'create_collection_index', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => true);
        },

        /**
         * Removes an index with the given name that has been previously
         * created in the collection.
         * This method executes a statement in the database and does not fail
         * if the index does not exist.
         * @function
         * @name module:Collection#dropIndex
         * @param {string} name - The name of the index.
         * @throws Index name is not a valid string.
         * @returns {Promise<boolean>} A <code>Promise</code> that resolves to
         * a boolean value which indicates whether the index was removed or not
         * (i.e. it did not exist).
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-indexing.html#collection-creating-index|Creating an Index}
         */
        dropIndex (name) {
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_NAME));
            }

            const args = [{
                name: name,
                schema: schema.getName(),
                collection: tableName
            }];

            return sqlExecute(connection, 'drop_collection_index', args, sqlExecute.Namespace.X_PLUGIN).execute()
                .then(() => true)
                .catch(err => {
                    if (!err.info || err.info.code !== errors.ER_CANT_DROP_FIELD_OR_KEY) {
                        throw err;
                    }

                    return false;
                });
        },

        /**
         * Checks if this collection exists in the database.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#existsInDatabase
         * @returns {Promise<boolean>} A <code>Promise</code> that resolves to
         * a boolean value which indicates whether the collection exists or
         * not.
         */
        existsInDatabase () {
            const args = [{ schema: schema.getName(), pattern: tableName }];

            return sqlExecute(connection, 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(res => {
                    return res.fetchAll().some(record => record[1] === 'COLLECTION');
                });
        },

        /**
         * Creates a statement that looks for one or more documents in the
         * collection which match an optional filtering criteria. All
         * documents will be part of an eventual result set if no filtering
         * criteria is provided.
         * @function
         * @name module:Collection#find
         * @param {SearchConditionStr} [searchConditionStr] - An optional
         * filtering criteria specified as a string or an X DevAPI expression.
         * @returns {module:CollectionFind} A new instance of a statement
         * containing the filtering criteria which will be used to perform
         * the lookup.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionfindfunction|CollectionFindFunction}
         */
        find (searchConditionStr) {
            const criteria = Expr({ value: searchConditionStr }).getValue();

            return collectionFind({ connection, criteria, schema, tableName });
        },

        /**
         * Retrieves the collection name.
         * This method works with the local collection instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Collection#getName
         * @returns {string} The name of the collection.
         */
        getName () {
            return tableName;
        },

        /**
         * Retrieves a single document with the given id.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#getOne
         * @param {string} id - The id of the document.
         * @example
         * collection.getOne('1')
         * @returns {Object} An object representing a local instance of the
         * document in the database. If the document does not exist in the
         * database, the object will be <code>null</code>.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-single-document-operations.html|Single Document Operations}
         */
        getOne (id) {
            let instance = null;

            // if the id is not provided, there is no need to even ask the server
            if (typeof id === 'undefined') {
                return Promise.resolve(instance);
            }

            getOneStatement = getOneStatement || this.find('_id = :id');

            return getOneStatement.bind('id', id)
                .execute(doc => {
                    instance = doc;
                })
                .then(() => instance);
        },

        /**
         * Retrieves the instance of the schema where the collection lives
         * under.
         * This method works with the local collection instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Collection#getSchema
         * @returns {module:Schema} The instance of the schema where statements
         * will be executed.
         */
        getSchema () {
            return schema;
        },

        /**
         * Retrieve the collection metadata.
         * This method works with the local collection instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Collection#inspect
         * @returns {Object} An object containing metadata about the
         * collection.
         */
        inspect () {
            return { schema: schema.getName(), collection: tableName };
        },

        /**
         * Creates a statement to modify one or more documents in the
         * collection that match a given filtering criteria. The filtering
         * criteria is required, and needs to match a truthy value (e.g.
         * '1', 'true') to modify all documents in the collection.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Collection#modify
         * @param {SearchConditionStr} searchConditionStr - The required
         * filtering criteria specified as a string or as an X DevAPI
         * expression.
         * @example
         * // update all documents in a collection
         * collection.modify('true').set('name', 'bar')
         *
         * // update documents that match a given condition
         * collection.modify('name = "foo"').set('name', 'bar')
         * @returns {module:CollectionModify} A new instance of a statement
         * containing the filtering criteria which will be used for
         * determining which documents will be modified.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionmodifyfunction|CollectionModifyFunction}
         */
        modify (searchConditionStr) {
            const criteria = Expr({ value: searchConditionStr }).getValue();

            return collectionModify({ connection, criteria, schema, tableName });
        },

        /**
         * Creates a statement to remove one or more documents from the
         * collection that match a given filtering criteria. The filtering
         * criteria is required, and needs to match a truthy value (e.g.
         * '1', 'true') when the goal is to remove all documents from the
         * collection.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Collection#remove
         * @param {SearchConditionStr} searchConditionStr - The required
         * filtering criteria specified as a string or as an X DevAPI
         * expression.
         * @example
         * // remove all documents from a collection
         * collection.remove('true')
         *
         * // remove documents that match a given condition
         * collection.remove('name = "foobar"')
         * @returns {module:CollectionRemove} A new instance of a statement
         * containing the filtering criteria which will be used for
         * determining which documents will be removed.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-collection-crud-functions.html#crud-ebnf-collectionremovefunction|CollectionRemoveFunction}
         */
        remove (searchConditionStr) {
            const criteria = Expr({ value: searchConditionStr }).getValue();

            return collectionRemove({ connection, criteria, schema, tableName });
        },

        /**
         * Removes a single document with the given id.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#removeOne
         * @param {string} id - The id of the dcoument.
         * @example
         * collection.removeOne('1')
         * @returns {Promise<module:Result>} A <code>Promise</code> that
         * resolves to an object containing the details reported by the server.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-single-document-operations.html|Single Document Operations}
         */
        removeOne (id) {
            removeOneStatement = removeOneStatement || this.remove('_id = :id');

            return removeOneStatement.bind('id', id).execute();
        },

        /**
         * Replaces a document that matches a given id with the set of field names
         * and values defined by a given object.
         * This method executes a statement in the database.
         * @function
         * @name module:Collection#replaceOne
         * @param {string} id - The id of the document.
         * @param {Object} data - An object containing the document fields and
         * corresponding values.
         * @example
         * collection.replaceOne('foo', { prop1: 'bar', prop2: 'baz' })
         * @throws Object contains an <code>_id</code> field whose value is
         * different then the given document id from the first argument.
         * @returns {Promise<module:Result>} A <code>Promise</code> that
         * resolves to an object containing the details reported by the server.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/collection-single-document-operations.html|Single Document Operations}
         */
        replaceOne (id, data = {}) {
            // If the reference id does not match a potential replacement
            // document id, the operation should be aborted.
            if (typeof data._id !== 'undefined' && data._id !== id) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH));
            }

            return this.modify('_id = :id')
                .bind('id', id)
                .set('$', data)
                .execute();
        }
    };
}

module.exports = Collection;
