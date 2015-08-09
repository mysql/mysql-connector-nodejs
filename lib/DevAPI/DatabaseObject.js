"use strict";

/**
 * Base object for different dataase objects
 * @param {Session} session
 * @param {Schema} schema
 * @constructor
 */
function DatabaseObject(session, schema) {
    this._session = session;
    this._schema = schema;
}

module.exports = DatabaseObject;

/**
 * Get session related to this object
 * @returns {Session|*}
 */
DatabaseObject.prototype.getSession = function () {
    return this._session;
};

/**
 * Get current schema
 * @returns {Schema|*}
 */
DatabaseObject.prototype.getSchema = function () {
    return this._schema;
};
