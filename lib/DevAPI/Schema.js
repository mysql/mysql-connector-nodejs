"use strict";

var Collection = require('./Collection'),
    DatabaseObject = require('./DatabaseObject');

/**
 * Access to Schema-related operations
 *
 * Usually you shouldn't create this yourself but via session object
 *
 * @param {BaseSession} session
 * @param {string} schema Name of the schema
 * @constructor
 * @extends DatabaseObject
 */
function Schema(session, schema) {
    DatabaseObject.call(this, session, schema);
}

module.exports = Schema;

Schema.prototype = Object.create(DatabaseObject.prototype);

/**
 * Get the name of ths schema
 * @returns {string}
 */
Schema.prototype.getName = function () {
    return this._schema;
};

/**
 * Get a Collection object
 *
 * This will always suceed
 *
 * @param {string} collection Name of the collection
 * @returns {Collection}
 */
Schema.prototype.getCollection = function (collection) {
    return new Collection(this._session, this, collection);
};

/**
 * Create a new collection
 *
 * The returned Promise object will resolve on success or provide an Error
 *
 * @param {string} collection Name of the collection
 * @returns {Promise.<Collection>}
 */
Schema.prototype.createCollection = function (collection) {
    var self = this;
    var args = [
        this._schema,
        collection
    ];
    return this._session._protocol.sqlStmtExecute("create_collection", args, null, null, "xplugin")
        .then(function () {
            return self.getCollection(collection);
        });
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
    return this._session._protocol.sqlStmtExecute("drop_collection", args, null, null, "xplugin");
};
