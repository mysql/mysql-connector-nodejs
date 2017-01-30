/*
 * Copyright (c) 2015, 2016, 2017, Oracle and/or its affiliates. All rights reserved.
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
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {object} document
 * @constructor
 */
function CollectionAdd (session, schema, collection, document) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._document = document || [];
}

module.exports = CollectionAdd;

/**
 * Add additional documents
 * @param {...Object|Object[]} document - object with document data
 * @throws {Error} When the input type is invalid.
 * @example
 * // arguments as single documents
 * collection.add({ foo: 'baz' }).add({ bar: 'qux' }, { biz: 'quux' })
 *
 * // array of documents
 * collection.add([{ foo: 'baz' }]).add([{ bar: 'qux' }, { biz: 'quux' }])
 * @returns {CollectionAdd}
 */
CollectionAdd.prototype.add = function () {
    const documents = parseFlexibleParamList(Array.prototype.slice.call(arguments));

    this._document = this._document.concat(documents);

    return this;
};

/**
 *
 * @returns {Promise.<Result>}
 */
CollectionAdd.prototype.execute = function () {
    if (!this._document.length) {
        return Promise.resolve();
    }

    const documentIds = [];

    const documents = this._document.map(doc => {
        if (!doc._id) {
            doc._id = this._session.idGenerator();
        }
        documentIds.push(doc._id);
        return [ JSON.stringify(doc) ];
    });

    return this._session._client
        .crudInsert(this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, documents)
        .then(state => {
            state.doc_ids = documentIds;
            return new Result(state);
        });
};
