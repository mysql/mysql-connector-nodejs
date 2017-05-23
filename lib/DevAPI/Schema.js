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

const Collection = require('./Collection');
const ColumnDefinition = require('./ColumnDefinition');
const DatabaseObject = require('./DatabaseObject');
const ForeignKeyDefinition = require('./ForeignKeyDefinition');
const Table = require('./Table');
const TableCreator = require('./TableCreater');
const ViewCreator = require('./ViewCreate');
const ViewDrop = require('./ViewDrop');
const util = require('util');

/**
 * Access to Schema-related operations
 *
 * Usually you shouldn't create this yourself but via session object
 *
 * @param {Session} session
 * @param {string} schema Name of the schema
 * @constructor
 * @extends DatabaseObject
 */
function Schema (session, schema) {
    DatabaseObject.call(this, session, schema);
}

module.exports = Schema;

util.inherits(Schema, DatabaseObject);

/**
 * Get the name of this schema
 * @returns {string}
 */
Schema.prototype.getName = function () {
    return this._schema;
};

/**
 * Verifies this schema exists
 *
 * @returns {Promise<boolean>}
 */
Schema.prototype.existsInDatabase = function () {
    let status = false;

    return this._session._client
        .sqlStmtExecute('SHOW DATABASES LIKE ?', [this._schema], (found) => { status = !!found.length; })
        .then(() => status);
};

/**
 * List objects of a given type using a factory function.
 */
function _listObjects (type, factory) {
    const result = {};
    const callback = (row) => {
        if (row[1] === type || type === 'TABLE' && row[1] === 'VIEW') {
            result[row[0]] = factory.call(this, row[0]);
        }
    };

    return this._session._client
        .sqlStmtExecute('list_objects', [this._schema], callback, null, 'xplugin')
        .then(() => result);
};

/**
 * Get collections
 *
 * @returns {Promise.<CollectionList>} Promise resolving to an object of Collection name <-> Collection object pairs
 */
Schema.prototype.getCollections = function () {
    return _listObjects.call(this, 'COLLECTION', this.getCollection);
};

/**
 * Get a Collection object
 *
 * This will always succeed
 *
 * @param {string} collection Name of the collection
 * @returns {Collection}
 */
Schema.prototype.getCollection = function (collection) {
    return new Collection(this._session, this, collection);
};

/**
 * Options
 * @typedef {object} createOptions
 * @property {bool} [ReuseExistingObject] If true this won't error if the collection exists already
 */

/**
 * Create a new collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} collection Name of the collection
 * @param {CreateOptions} [options]
 * @returns {Promise.<Collection>}
 */
Schema.prototype.createCollection = function (collection, options) {
    options = Object.assign({}, { ReuseExistingObject: false }, options);

    const args = [this._schema, collection];

    return this._session._client.sqlStmtExecute('create_collection', args, null, null, 'xplugin')
        .then(() => this.getCollection(collection))
        .catch(err => {
            if (err.info.code !== 1050 || !options.ReuseExistingObject) {
                throw err;
            }

            return this.getCollection(collection);
        });
};

/**
 * Create a new Table in this schema.
 *
 *
 * An example for using this function can be found in the {@tutorial Table_Creation_API} tutorial.
 *
 *
 * @param {String} name Name of the new table
 * @param {bool} reuseExisting Flag whether to reuse an existing table, defaults to false
 * @return {TableCreater}
 */
Schema.prototype.createTable = function (name, reuseExisting) {
    return new TableCreator(this, name, reuseExisting);
};

/**
 * Type flags for table creation
 * @type {{Bit: string, Tinyint: string, Smallint: string, Mediumint: string, Int: string, Bigint: string, Real: string, Double: string, Float: string, Decimal: string, Numeric: string, Date: string, Time: string, Timestamp: string, Datetime: string, Year: string, Char: string, Varchar: string, Binary: string, Varbinary: string, Tinyblob: string, Blob: string, Mediumblob: string, Longblob: string, Tinytext: string, Text: string, Mediumtext: string, Enum: string, Set: string, Json: string}}
 */
Schema.prototype.Type = {
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
};

/**
 * Create a Column Definition object which can be injected into
 * {@link TableCreater#addColumn}
 *
 * @see {TableCreater#addColumn}
 * @param {string} name - Name for the field
 * @param {String} type - The type for the field, usually a member of {@link Schema#Type} should be used
 * @param {Number=} length
 * @returns {ColumnDefinition]
 */
Schema.prototype.columnDef = function (name, type, length) {
    return new ColumnDefinition(name, type, length);
};

/**
 * Foreign Key Definition for Table Creation
 *
 * @returns {ForeignKeyDefinition}
 */
Schema.prototype.foreignKey = function () {
    return new ForeignKeyDefinition(this);
};

/**
 * Create a new view
 *
 * This will return an object which can be used to create a view
 *
 * @param {string} name
 * @param {bool} replace
 * @returns {ViewCreate}
 */
Schema.prototype.createView = function (name, replace) {
    return new ViewCreator(this, name, replace);
};

/**
 * Alters a view
 *
 * This will return an object which can be used to create a new view definition
 *
 * @param {string} name
 * @param {bool} replace
 * @returns {ViewCreate}
 */
Schema.prototype.alterView = function (name) {
    return new ViewCreator(this, name, true);
};

/**
 * Produce ViewDrop object to drop a view
 * @param {String} name
 * @returns {ViewDrop}
 */
Schema.prototype.dropView = function (name) {
    return new ViewDrop(this, name);
};

/**
 * Drop a collection (without failing even if the collection does not exist).
 * @param {string} name - collection name
 * @returns {Promise.<boolean>}
 */
Schema.prototype.dropCollection = function (name) {
    return this._session._client
        .sqlStmtExecute('drop_collection', [this._schema, name], null, null, 'xplugin')
        .then(() => true)
        .catch(err => {
            // Don't fail if the collection does not exist.
            if (!err.info || err.info.code !== 1051) {
                throw err;
            }

            return true;
        });
};

/**
 * Get tables
 *
 * @returns {Promise.<TableList>} Promise resolving to an object of Table name <-> Table object pairs
 */
Schema.prototype.getTables = function () {
    return _listObjects.call(this, 'TABLE', this.getTable);
};

/**
 * Get a Table object
 *
 * This will always succeed
 *
 * @param {string} table Name of the table
 * @returns {Table}
 */
Schema.prototype.getTable = function (table) {
    return new Table(this._session, this, table);
};

/**
 * Get a Table object or a given named Collection
 *
 * @param {string} collection Name of the collection
 * @returns {Table}
 */
Schema.prototype.getCollectionAsTable = function (collection) {
    return new Table(this._session, this, collection);
};

/**
 * Drop a table
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} table Name of table to drop
 * @returns {Promise.<bool>}
 */
Schema.prototype.dropTable = function (table) {
    return this.getTable(table).drop();
};

/**
 * Inspect schema
 */
Schema.prototype.inspect = function () {
    return { schema: this._schema };
};

