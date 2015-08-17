"use strict";

// TODO: Lots of duplication with CollectionFind ....

/**
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {Collection} collection
 * @param {String} [query]
 * @constructor
 */
function CollectionRemove(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._limit = null;
    this._bounds = [];
}

module.exports = CollectionRemove;

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {CollectionRemove}
 */
CollectionRemove.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

CollectionRemove.prototype.bind = function (bind) {
    this._bounds.push(bind);
    return this;
};

/**
 * Execute remove operation
 */
CollectionRemove.prototype.execute = function () {
    return this
        ._session
        ._protocol
        .crudRemove(this._session, this._schema.getName(), this._collection, this._query, this._limit);
};
