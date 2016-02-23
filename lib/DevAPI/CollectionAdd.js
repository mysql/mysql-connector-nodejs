/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

const Client = require('../Protocol/Client'),
    Result = require('./Result');

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {object} document
 * @constructor
 */
function CollectionAdd(session, schema, collection, document) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._document = document;
}

module.exports = CollectionAdd;

/**
 *
 * @returns {Promise.<Result>}
 */
CollectionAdd.prototype.execute = function () {
    const generatedIds = [];

    const documents = this._document.map(doc => {
        if (!doc._id) {
            doc._id = this._session.idGenerator();
            generatedIds.push(doc._id);
        }
        return [ doc ];
    });

    return this.
        _session.
        _client.
        crudInsert(this._schema.getName(), this._collection, Client.dataModel.DOCUMENT, documents).
        then(state => {
            state.generated_doc_ids = generatedIds;
            return new Result(state);
        });
};
