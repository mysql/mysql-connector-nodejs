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

const ColumnDefinition = require('./ColumnDefinition');
const ForeignKeyDefinition = require('./ForeignKeyDefinition');
const TableFactory = require('./TableFactory');
const ViewFactory = require('./ViewFactory');
const collection = require('./Collection');
const databaseObject = require('./DatabaseObject');
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
         * Type flags for table creation
         * @type {{Bit: string, Tinyint: string, Smallint: string, Mediumint: string, Int: string, Bigint: string, Real: string, Double: string, Float: string, Decimal: string, Numeric: string, Date: string, Time: string, Timestamp: string, Datetime: string, Year: string, Char: string, Varchar: string, Binary: string, Varbinary: string, Tinyblob: string, Blob: string, Mediumblob: string, Longblob: string, Tinytext: string, Text: string, Mediumtext: string, Enum: string, Set: string, Json: string}}
         */
        Type: {
            Bit: 'BIT',
            Tinyint: 'TINYINT',
            Smallint: 'SMALLINT',
            Mediumint: 'MEDIUMINT',
            Int: 'INT',
            Bigint: 'BIGINT',
            Real: 'REAL',
            Double: 'DOUBLE',
            Float: 'FLOAT',
            Decimal: 'DECIMAL',
            Numeric: 'NUMERIC',
            Date: 'DATE',
            Time: 'TIME',
            Timestamp: 'TIMESTAMP',
            Datetime: 'DATETIME',
            Year: 'YEAR',
            Char: 'CHAR',
            Varchar: 'VARCHAR',
            Binary: 'BINARY',
            Varbinary: 'VARBINARY',
            Tinyblob: 'TINYBLOB',
            Blob: 'BLOB',
            Mediumblob: 'MEDIUMBLOB',
            Longblob: 'LONGBLOB',
            Tinytext: 'TINYTEXT',
            Text: 'TEXT',
            Mediumtext: 'MEDIUMTEXT',
            Enum: 'ENUM',
            Set: 'SET',
            Json: 'JSON'
        },

        /**
         * Create an operation to alter a view.
         * @function
         * @name module:Schema#alterView
         * @param {string} name
         * @returns {ViewFactory}
         */
        alterView (name) {
            return new ViewFactory(this, name, true);
        },

        /**
         * Create a Column Definition object which can be injected into {@link TableCreater#addColumn}.
         * @function
         * @name module:Schema#columnDef
         * @see {TableFactory#addColumn}
         * @param {string} name - field name
         * @param {string} type - field type, usually a member of {@link Schema#Type} should be used
         * @param {number} length
         * @returns {ColumnDefinition}
         */
        columnDef (name, type, length) {
            return new ColumnDefinition(name, type, length);
        },

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

            return this
                .getSession()
                ._client
                .sqlStmtExecute('create_collection', args, null, null, 'xplugin')
                .then(() => this.getCollection(collection))
                .catch(err => {
                    if (err.info.code !== 1050 || !options.ReuseExistingObject) {
                        throw err;
                    }

                    return this.getCollection(collection);
                });
        },

        /**
         * Retrieve the factory to create a new table in the schema (examples available in the {@tutorial Table_Creation_API} tutorial).
         * @function
         * @name module:Schema#createTable
         * @param {string} name - table name
         * @param {bool} replace - re-use or throw error if a table with the same name already exists
         * @return {TableFactory}
         */
        createTable (name, replace) {
            return new TableFactory(this, name, replace);
        },

        /**
         * Retrieve the factory to create a new view in the schema.
         * @function
         * @name module:Schema#createView
         * @param {string} name
         * @param {bool} replace - re-use or throw error if a table with the same name already exists
         * @returns {ViewFactory}
         */
        createView (name, replace) {
            return new ViewFactory(this, name, replace);
        },

        /**
         * Drop a collection from the schema (without failing even if the collection does not exist).
         * @function
         * @name module:Schema#dropCollection
         * @param {string} name - collection name
         * @returns {Promise.<boolean>}
         */
        dropCollection (name) {
            return this
                .getSession()
                ._client
                .sqlStmtExecute('drop_collection', [this.getName(), name], null, null, 'xplugin')
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
         * Drop a table from the schema (without failing even if the table does not exist).
         * @function
         * @name module:Schema#dropTable
         * @param {string} name - table name
         * @returns {Promise.<boolean>}
         */
        // TODO(Rui): remove duplication with dropCollection.
        dropTable (name) {
            const schema = table.escapeIdentifier(this.getName());
            const tableName = table.escapeIdentifier(name);

            return this
                .getSession()
                ._client
                .sqlStmtExecute(`DROP TABLE ${schema}.${tableName}`)
                .then(() => true)
                .catch(err => {
                    // Don't fail if the table does not exist.
                    if (!err.info || err.info.code !== 1051) {
                        throw err;
                    }

                    return true;
                });
        },

        /**
         * Drop a view from the schema (without failing even if the view does not exist).
         * @function
         * @name module:Schema#dropView
         * @param {String} name - view name
         * @returns {Promise.<boolean>}
         */
        // TODO(Rui): remove duplication with dropCollection.
        dropView (name) {
            const schema = table.escapeIdentifier(this.getName());
            const view = table.escapeIdentifier(name);

            return this
                .getSession()
                ._client
                .sqlStmtExecute(`DROP VIEW ${schema}.${view}`)
                .then(() => true)
                .catch(err => {
                    // Don't fail if the view does not exist.
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
            let status = false;

            return this
                .getSession()
                ._client
                .sqlStmtExecute('SHOW DATABASES LIKE ?', [this.getName()], (found) => { status = !!found.length; })
                .then(() => status);
        },

        /**
         * Create a Foreign Key Definition for table creation.
         * @function
         * @name module:Schema:foreignKey
         * @returns {ForeignKeyDefinition}
         */
        foreignKey () {
            return new ForeignKeyDefinition(this);
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:Schema:getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'Schema';
        },

        /**
         * Retrieve the instance of a given collection.
         * @function
         * @name module:Schema:getCollection
         * @param {string} name - collection name
         * @returns {Collection}
         */
        getCollection (name) {
            return collection(this.getSession(), this, name);
        },

        /**
         * Retrieve the instance of a given table or named collection.
         * @function
         * @name module:Schema:getCollectionAsTable
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
         * @name module:Schema:getCollections
         * @returns {Promise.<CollectionList>}
         */
        getCollections () {
            return _listObjects.call(this, 'COLLECTION', this.getCollection);
        },

        /**
         * Retrieve the schema name.
         * @function
         * @name module:Schema:getName
         * @returns {string}
         */
        getName () {
            return state.name;
        },

        /**
         * Retrieve the instance of a given table.
         * @function
         * @name module:Schema:getTable
         * @param {string} name - table name
         * @returns {Table}
         */
        getTable (name) {
            return table(this.getSession(), this, name);
        },

        /**
         * List of available tables.
         * @typedef {object} TableList
         * @property {Table} [<table name>] The table instance
         */

        /**
         * Retrieve the list of tables that exist in the schema.
         * @function
         * @name module:Schema:getTables
         * @returns {Promise.<TableList>}
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
    const result = {};
    const callback = (row) => {
        if (row[1] === type || type === 'TABLE' && row[1] === 'VIEW') {
            result[row[0]] = factory.call(this, row[0]);
        }
    };

    return this
        .getSession()
        ._client
        .sqlStmtExecute('list_objects', [this.getName()], callback, null, 'xplugin')
        .then(() => result);
};

module.exports = Schema;
