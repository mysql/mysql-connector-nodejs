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
 * @returns Promise
 */
Schema.prototype.createCollection = function (collection) {
    var args = [
        this._schema,
        collection
    ];
    return this._session._protocol.sqlStmtExecute("create_collection", args, "xplugin");
};
