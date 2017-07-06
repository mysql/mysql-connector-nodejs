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

const DatabaseObject = require('./DatabaseObject');
const LinkOperations = require('./LinkOperations');
const Table = require('./Table');
const collectionAdd = require('./CollectionAdd');
const collectionFind = require('./CollectionFind');
const collectionModify = require('./CollectionModify');
const collectionRemove = require('./CollectionRemove');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const util = require('util');

/**
 * Collection object
 *
 * Usually you shouldn't create an instance of this but ask a Schema for it
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {String} collection
 * @param {String} alias
 * @param {object} links
 * @constructor
 * @extends DatabaseObject
 */
function Collection (session, schema, collection, alias, links) {
    DatabaseObject.call(this, session, schema);

    this._collection = collection;
    this._links = links || {};
    this._alias = alias;
}

module.exports = Collection;

util.inherits(Collection, DatabaseObject);
LinkOperations.applyTo(Collection);

/**
 * Get the name of this collection
 * @returns {string}
 */
Collection.prototype.getName = function () {
    return this._collection;
};

/**
 * Verifies this collection exists
 * @returns {Promise<boolean>}
 */
Collection.prototype.existsInDatabase = function () {
    const args = [this._schema.getName(), this._collection];
    let status = false;

    return this._session._client
        .sqlStmtExecute('list_objects', args, (found) => { status = !!found.length; }, null, 'xplugin')
        .then(() => status);
};

/**
 * Find documents from a collection
 * @param {String} expr Expression
 * @returns {CollectionFind}
 */
Collection.prototype.find = function (expr) {
    return collectionFind(this._session, this._schema, this._collection, expr);
};

/**
 * Add documents
 * @param {...Object|Object[]} document - object with document data
 * @throws {Error} When the input type is invalid.
 * @example
 * // arguments as single documents
 * collection.add({ foo: 'baz' }, { bar: 'qux' })
 *
 * // array of documents
 * collection.add([{ foo: 'baz' }, { bar: 'qux' }])
 * @returns {CollectionAdd}
 */
Collection.prototype.add = function () {
    const documents = parseFlexibleParamList(Array.prototype.slice.call(arguments));

    return collectionAdd(this._session, this._schema, this._collection, documents);
};

/**
 * Run modify operations
 * @param {string} expr Expression
 * @example
 * // update all documents in a collection
 * collection.modify('true').set('name', 'bar')
 *
 * // update documents that match a given condition
 * collection.modify('$.name == "foo"').set('name', 'bar')
 * @returns {CollectionModify}
 */
Collection.prototype.modify = function (expr) {
    return collectionModify(this._session, this._schema, this._collection, expr);
};

/**
 * Create an operation to remove documents from a collection.
 * @param {string} expr Expression
 * @example
 * // remove all documents from a collection
 * collection.remove('true')
 *
 * // remove documents that match a given condition
 * collection.remove('$.name == "foobar"')
 * @returns {CollectionRemove}
 */
Collection.prototype.remove = function (expr) {
    return collectionRemove(this._session, this._schema, this._collection, expr);
};

/**
 * Get number of documents in this Collection
 *
 * @returns {Promise.<Number>}
 */
Collection.prototype.count = function () {
    const schema = Table.escapeIdentifier(this._schema.getName());
    const collection = Table.escapeIdentifier(this._collection);

    let count = 0;

    return this._session._client
        .sqlStmtExecute(`SELECT COUNT(*) FROM ${schema}.${collection}`, [], row => { count = row[0]; })
        .then(() => count);
};

/**
 * Set alias for link operation
 * @param {String} alias
 * @returns {Collection}
 */
Collection.prototype.as = function (alias) {
    return new Collection(this._session, this._schema, this._collection, alias, this._links);
};

Collection.prototype.inspect = function () {
    return { schema: this._schema.getName(), collection: this._collection };
};
