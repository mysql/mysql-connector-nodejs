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

const collection = require('./Collection');
const errors = require('../constants/errors');
const databaseObject = require('./DatabaseObject');
const logger = require('../logger');
const sqlExecute = require('./SqlExecute');
const table = require('./Table');
const warnings = require('../constants/warnings');

const log = logger('api:schema');

/**
 * Enum to identify schema validation levels.
 * @readonly
 * @name module:Schema.ValidationLevel
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
 * Options available for specifying a collection validation schema.
 * @typedef {object} module:Schema.SchemaValidationOptions
 * @prop {object} [schema] - [JSON Schema]{@link https://json-schema.org/} definition
 * @prop {module:Schema.ValidationLevel} [level] - enforcement level
 */

/**
 * Options available for creating a new collection.
 * @typedef {object} module:Schema.CreateCollectionOptions
 * @prop {bool} [reuseExisting] re-use or throw error if a collection with the same name already exists
 * @prop {module:Schema.SchemaValidationOptions} [validation] schema validation options
 */

/**
 * Options available for modifying an existing collection.
 * @typedef {object} module:Schema.ModifyCollectionOptions
 * @prop {module:Schema.SchemaValidationOptions} [validation] schema validation options
 */

/**
 * @private
 * @alias module:Schema
 * @param {Connection} connection - database connection context
 * @param {string} name - schema name
 * @returns {module:Schema}
 */
function Schema (connection, name) {
    return Object.assign({}, databaseObject(connection), {
        /**
         * Create a new collection in the schema.
         * @function
         * @name module:Schema#createCollection
         * @param {string} name - collection name
         * @param {module:Schema.CreateCollectionOptions} [options]
         * @returns {Promise.<module:Collection>}
         */
        createCollection (name, options) {
            options = Object.assign({}, { reuseExisting: false }, options);

            if (options.ReuseExistingObject) {
                log.warning('createCollection', warnings.MESSAGES.WARN_DEPRECATED_CREATE_COLLECTION_REUSE_EXISTING, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            options.reuse_existing = options.ReuseExistingObject || options.reuseExisting;
            // remove API deprecated option
            delete options.ReuseExistingObject;
            // remove unknown plugin option (should use "reuse_existing" instead)
            delete options.reuseExisting;

            const args = [{ schema: this.getName(), name, options }];

            // The options object only contains the "reuse_existing" property, and in that case, no options
            // should be encoded in the message arguments to ensure compatibility with older MySQL server versions.
            if (Object.keys(options).length === 1) {
                delete args[0].options;
            }

            return sqlExecute(connection, 'create_collection', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => {
                    return this.getCollection(name);
                })
                .catch(err => {
                    // Handle existing collections on older MySQL server versions.
                    if (err.info && err.info.code === errors.ER_TABLE_EXISTS_ERROR && options.reuse_existing) {
                        return this.getCollection(name);
                    }

                    if (err.info && err.info.code === errors.ER_X_CMD_NUM_ARGUMENTS) {
                        err.message = errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED;
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

            return sqlExecute(connection, 'drop_collection', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => {
                    return true;
                })
                .catch(err => {
                    // Don't fail if the collection does not exist.
                    if (!err.info || err.info.code !== errors.ER_BAD_TABLE_ERROR) {
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
            return sqlExecute(connection, 'SHOW DATABASES LIKE ?', [this.getName()])
                .execute()
                .then(res => {
                    return res.fetchAll().length > 0;
                });
        },

        /**
         * Retrieve the instance of a given collection.
         * @function
         * @name module:Schema#getCollection
         * @param {string} name - collection name
         * @returns {module:Collection}
         */
        getCollection (name) {
            return collection({ connection, schema: this, tableName: name });
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

            return sqlExecute(connection, 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute(callback)
                .then(() => {
                    return collections;
                });
        },

        /**
         * Retrieve the schema name.
         * @function
         * @name module:Schema#getName
         * @returns {string}
         */
        getName () {
            return name;
        },

        /**
         * Retrieve the instance of a given table.
         * @function
         * @name module:Schema#getTable
         * @param {string} name - table name
         * @returns {module:Table}
         */
        getTable (name) {
            return table({ connection, schema: this, tableName: name });
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

            return sqlExecute(connection, 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
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
         * @param {module:Schema.ModifyCollectionOptions} [options]
         * @returns {Promise.<module:Collection>}
         */
        modifyCollection (name, options) {
            const args = [{ schema: this.getName(), name, options }];
            const command = 'modify_collection_options';

            return sqlExecute(connection, command, args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => {
                    return this.getCollection(name);
                })
                .catch(err => {
                    if (err.info && err.info.code === errors.ER_X_INVALID_ADMIN_COMMAND) {
                        err.message = errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED;
                    }

                    throw err;
                });
        }
    });
}

// Export constants.
Schema.ValidationLevel = ValidationLevel;

module.exports = Schema;
