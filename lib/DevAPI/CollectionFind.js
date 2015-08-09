"use strict";

/**
 * A callback for a single document
 *
 * This will be called for each document received from a Collection
 *
 * @callback documentCallback The document as stored in the database
 * @param {object} object
 */

/**
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {String} [query]
 * @constructor
 */
function CollectionFind(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._limit = null;
    this._bounds = [];
}

module.exports = CollectionFind;

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionFind}
 */
CollectionFind.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

CollectionFind.prototype.bind = function (bind) {
    this._bounds.push(bind);
    return this;
};

/**
 * Execute find operation
 * @param {documentCallback} rowcb
 */
CollectionFind.prototype.execute = function (rowcb) {
    return this
        ._session
        ._protocol
        .crudFind(this._session, this._schema.getName(), this._collection, this._query, this._limit, rowcb);
};
