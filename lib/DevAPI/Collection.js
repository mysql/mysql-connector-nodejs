"use strict";

var DatabaseObject = require('./DatabaseObject'),
    CollectionFind = require('./CollectionFind'),
    CollectionAdd = require('./CollectionAdd'),
    CollectionRemove = require('./CollectionRemove');

/**
 * Collection object
 *
 * Usually you shouldn't create an instance of this but ask a Schema for it
 *
 * @param {Session} session
 * @param {Schema} schema
 * @param {String} collection
 * @constructor
 * @extends DatabaseObject
 */
function Collection(session, schema, collection) {
    DatabaseObject.call(this, session, schema);
    this._collection = collection;
}

module.exports = Collection;

Collection.prototype = Object.create(DatabaseObject.prototype);

/**
 * Find documents from a collection
 * @param {String} expr Expression
 * @returns {CollectionFind}
 */
Collection.prototype.find = function (expr) {
    return new CollectionFind(this._session, this._schema, this._collection, expr);
};

/**
 * Add one or more documents
 *
 * Multiple documents can be provided as array or by using multiple arguments
 *
 * @param {...object|Array} document
 * @returns {CollectionAdd}
 */
Collection.prototype.add = function (document) {
    var documents = (arguments.length === 1 && Array.isArray(document)) ?
        document : Array.prototype.slice.call(arguments);

    return new CollectionAdd(this._session, this._schema, this._collection, documents);
};

/**
 * Remove documents from a collection
 * @param {String} expr Expression
 * @returns {CollectionRemove}
 */
Collection.prototype.remove = function (expr) {
    return new CollectionRemove(this._session, this._schema, this._collection, expr);
};

/**
 * Drop this collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @returns {Promise.<bool>}
 */
Collection.prototype.drop = function () {
    var args = [
        this._schema.getName(),
        this._collection
    ];
    return this._session._protocol.sqlStmtExecute("drop_collection", args, null, null, "xplugin").then(function () {
        return true;
    });
};
