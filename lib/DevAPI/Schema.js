/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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
const stmtExecute = require('./StmtExecute');
const table = require('./Table');

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
 * @returns {Schema}
 */
function Schema (session, name) {
    const state = Object.assign({}, { name, session });

    return Object.assign({}, databaseObject(session), {
        /**
         * Options available for creating a new collection.
         * @typedef {object} CreateCollectionOptions
         * @property {bool} [ReuseExistingObject] re-use or throw error if a collection with the same name already exists
         */

        /**
         * Create a new collection in the schema.
         * @function
         * @name module:Schema#createCollection
         * @param {string} collection - collection name
         * @param {CreateCollectionOptions} [options] - setup options
         * @returns {Promise.<Collection>}
         */
        createCollection (collection, options) {
            options = Object.assign({}, { ReuseExistingObject: false }, options);

            const args = [this.getName(), collection];

            return stmtExecute(this.getSession(), 'create_collection', args, stmtExecute.Namespace.X_PLUGIN)
                .execute()
                .then(() => this.getCollection(collection))
                .catch(err => {
                    if (err.info.code !== 1050 || !options.ReuseExistingObject) {
                        throw err;
                    }

                    return this.getCollection(collection);
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
            const args = [this.getName(), name];

            return stmtExecute(this.getSession(), 'drop_collection', args, stmtExecute.Namespace.X_PLUGIN)
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
        // TODO(Rui): extract method into a proper aspect (to be used on Collection, Schema and Table).
        existsInDatabase () {
            const args = [this.getName()];

            let status = false;
            const callback = found => { status = !!found.length; };

            return stmtExecute(this.getSession(), 'SHOW DATABASES LIKE ?', args)
                .execute(callback)
                .then(() => status);
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:Schema#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'Schema';
        },

        /**
         * Retrieve the instance of a given collection.
         * @function
         * @name module:Schema#getCollection
         * @param {string} name - collection name
         * @returns {Collection}
         */
        getCollection (name) {
            return collection(this.getSession(), this.getName(), name);
        },

        /**
         * Retrieve the instance of a given table or named collection.
         * @function
         * @name module:Schema#getCollectionAsTable
         * @param {string} name - collection name
         * @returns {Table}
         */
        getCollectionAsTable (name) {
            return this.getTable(name);
        },

        /**
         * List of available collections.
         * @typedef {object} CollectionList
         * @property {Collection} [<collection name>] The collection instance
         */

        /**
         * Retrieve the list of collections that exist in the schema.
         * @function
         * @name module:Schema#getCollections
         * @returns {Promise.<CollectionList>}
         */
        getCollections () {
            return _listObjects.call(this, 'COLLECTION', this.getCollection);
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
         * @returns {Table}
         */
        getTable (name) {
            return table(this.getSession(), this.getName(), name);
        },

        /**
         * Retrieve the list of tables that exist in the schema.
         * @function
         * @name module:Schema#getTables
         * @returns {Promise.<Object.<string>>}
         */
        getTables () {
            return _listObjects.call(this, 'TABLE', this.getTable);
        },

        /**
         * Retrieve the schema metadata.
         * @function
         * @name module:Schema#inspect
         * @returns {Object} An object containing the relevant metadata.
         */
        inspect () {
            return { schema: this.getName() };
        }
    });
}

/**
 * List objects of a given type using a factory function.
 * @private
 */
function _listObjects (type, factory) {
    const args = [this.getName()];

    const result = {};
    const callback = (row) => {
        if ((row[1] === type) || (type === 'TABLE' && row[1] === 'VIEW')) {
            result[row[0]] = factory.call(this, row[0]);
        }
    };

    return stmtExecute(this.getSession(), 'list_objects', args, stmtExecute.Namespace.X_PLUGIN)
        .execute(callback)
        .then(() => result);
};

module.exports = Schema;
