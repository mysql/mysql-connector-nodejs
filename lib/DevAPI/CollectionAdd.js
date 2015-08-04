"use strict";

function CollectionAdd(session, schema, collection, document) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._document = document;
}

module.exports = CollectionAdd;

CollectionAdd.prototype.execute = function () {
    var documents = this._document;
    documents.forEach(function (doc) {
        if (!doc._id) {
            // TODO - Use a proper ID generator!
            doc._id = Math.floor(Math.random() * 500000) + '-' + Math.floor(Math.random() * 500000);
        }
    });
    return this._session._protocol.crudInsert(this._schema.getName(), this._collection, documents);
};
