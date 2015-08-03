"use strict";

function DatabaseObject(session, schema) {
    this._session = session;
    this._schema = schema;
}

module.exports = DatabaseObject;

DatabaseObject.prototype.getSession = function () {
    return this._session;
};

DatabaseObject.prototype.getSchema = function () {
    return this._schema;
};
