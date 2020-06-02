/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates.
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

const collection = require('./Collection');
const databaseObject = require('./DatabaseObject');
const deprecated = require('./Util/deprecated');
const sqlExecute = require('./SqlExecute');
const table = require('./Table');

/**
 * Enum to identify possible errors related to collection options.
 * @private
 * @readonly
 * @name Errors
 * @enum {number}
 * @example
 * Errors.COLLECTION_ALREADY_EXISTS
 * Errors.CREATE_COLLECTION_OPTIONS_NOT_SUPPORTED
 * Errors.MODIFY_COLLECTION_OPTIONS_NOT_SUPPORTED
 */
const Errors = {
    COLLECTION_ALREADY_EXISTS: 1050,
    CREATE_COLLECTION_OPTIONS_NOT_SUPPORTED: 5015,
    MODIFY_COLLECTION_OPTIONS_NOT_SUPPORTED: 5157
};

/**
 * Enum to identify schema validation levels.
 * @readonly
 * @name ValidationLevel
 * @enum {string}
 * @example
 * ValidationLevel.OFF
 * ValidationLevel.STRICT
 */
const ValidationLevel = {
    OFF: 'off',
    STRICT: 'strict'
};

/**
 * Schema factory.
 * @module Schema
 * @mixes DatabaseObject
 */

/**
 * @private
 * @alias module:Schema
 * @param {Session} session - session to bind
 * @param {string} name - schema name
 * @returns {module:Schema}
 */
function Schema (session, name) {
    const state = Object.assign({}, { name, session });

    return Object.assign({}, databaseObject(session), {
        /**
         * Options available for creating a new collection.
         * @typedef {object} CreateCollectionOptions
         * @property {bool} [reuseExisting] re-use or throw error if a collection with the same name already exists
         */

        /**
         * Create a new collection in the schema.
         * @function
         * @name module:Schema#createCollection
         * @param {string} name - collection name
         * @param {CreateCollectionOptions} [options] - setup options
         * @returns {Promise.<module:Collection>}
         */
        createCollection (name, options) {
            options = Object.assign({}, { reuseExisting: false }, options);

            if (options.ReuseExistingObject) {
                deprecated('The "ReuseExistingObject" option in Schema.createCollection() is deprecated since version 8.0.19 and will not be available in future versions. Use "reuseExisting" instead.');
            }

            options.reuse_existing = options.ReuseExistingObject || options.reuseExisting;
            // remove API deprecated option
            delete options.ReuseExistingObject;
            // remove unknown plugin option (should use "reuse_existing" instead)
            delete options.reuseExisting;

            let args = [{ schema: this.getName(), name, options }];

            // The options object only contains the "reuse_existing" property, and in that case, no options
            // should be encoded in the message arguments to ensure compatibility with older MySQL server versions.
            if (Object.keys(options).length === 1) {
                delete args[0].options;
            }

            return sqlExecute(this.getSession(), 'create_collection', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => this.getCollection(name))
                .catch(err => {
                    // Handle existing collections on older MySQL server versions.
                    if (err.info && err.info.code === Errors.COLLECTION_ALREADY_EXISTS && options.reuse_existing) {
                        return this.getCollection(name);
                    }

                    if (err.info && err.info.code === Errors.CREATE_COLLECTION_OPTIONS_NOT_SUPPORTED) {
                        err.message = 'Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.';
                    }

                    throw err;
                });
        },

        /**
         * Drop a collection from the schema (without failing even if the collection does not exist).
         * @function
         * @name module:Schema#dropCollection
         * @param {string} name - collection name
         * @returns {Promise.<boolean>}
         */
        dropCollection (name) {
            const args = [{ schema: this.getName(), name }];

            return sqlExecute(this.getSession(), 'drop_collection', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => true)
                .catch(err => {
                    // Don't fail if the collection does not exist.
                    if (!err.info || err.info.code !== 1051) {
                        throw err;
                    }

                    return true;
                });
        },

        /**
         * Check if this schema exists in the database.
         * @function
         * @name module:Schema#existsInDatabase
         * @returns {Promise.<boolean>}
         */
        existsInDatabase () {
            return sqlExecute(this.getSession(), 'SHOW DATABASES LIKE ?', [this.getName()])
                .execute()
                .then(res => res.fetchAll().length > 0);
        },

        /**
         * Retrieve the instance of a given collection.
         * @function
         * @name module:Schema#getCollection
         * @param {string} name - collection name
         * @returns {module:Collection}
         */
        getCollection (name) {
            return collection(this.getSession(), this, name);
        },

        /**
         * Retrieve the instance of a given table or named collection.
         * @function
         * @name module:Schema#getCollectionAsTable
         * @param {string} name - collection name
         * @returns {module:Table}
         */
        getCollectionAsTable (name) {
            return this.getTable(name);
        },

        /**
         * Retrieve the list of collections that exist in the schema.
         * @function
         * @name module:Schema#getCollections
         * @returns {Promise.<Array.<module:Collection>>} A promise that resolves to the array of collection instances.
         */
        getCollections () {
            const args = [{ schema: this.getName() }];
            const collections = [];

            const callback = row => {
                if (row[1] !== 'COLLECTION') {
                    return;
                }

                collections.push(this.getCollection(row[0].toString()));
            };

            return sqlExecute(this.getSession(), 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute(callback)
                .then(() => collections);
        },

        /**
         * Retrieve the schema name.
         * @function
         * @name module:Schema#getName
         * @returns {string}
         */
        getName () {
            return state.name;
        },

        /**
         * Retrieve the instance of a given table.
         * @function
         * @name module:Schema#getTable
         * @param {string} name - table name
         * @returns {module:Table}
         */
        getTable (name) {
            return table(this.getSession(), this, name);
        },

        /**
         * Retrieve the list of tables that exist in the schema.
         * @function
         * @name module:Schema#getTables
         * @returns {Promise.<Array.<module:Table>>} A promise that resolves to the array of table instances.
         */
        getTables () {
            const args = [{ schema: this.getName() }];
            const tables = [];

            const callback = row => {
                if (row[1] !== 'TABLE' && row[1] !== 'VIEW') {
                    return;
                }

                tables.push(this.getTable(row[0].toString()));
            };

            return sqlExecute(this.getSession(), 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute(callback)
                .then(() => tables);
        },

        /**
         * Retrieve the schema metadata.
         * @function
         * @name module:Schema#inspect
         * @returns {Object} An object containing the relevant metadata.
         */
        inspect () {
            return { name: this.getName() };
        },

        /**
         * Modify the options of an existing collection in the schema.
         * @function
         * @name module:Schema#modifyCollection
         * @param {string} name - collection name
         * @param {modifyCollectionOptions} [options] - setup options
         * @returns {Promise.<module:Collection>}
         */
        modifyCollection (name, options) {
            const args = [{ schema: this.getName(), name, options }];
            const command = 'modify_collection_options';

            return sqlExecute(this.getSession(), command, args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => this.getCollection(name))
                .catch(err => {
                    if (err.info && err.info.code === Errors.MODIFY_COLLECTION_OPTIONS_NOT_SUPPORTED) {
                        err.message = 'Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.';
                    }

                    throw err;
                });
        }
    });
}

Schema.ValidationLevel = ValidationLevel;

module.exports = Schema;
