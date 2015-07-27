function CollectionAdd(session, schema, collection, document) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._document = document;
}

module.exports = CollectionAdd;

CollectionAdd.prototype.execute = function () {
    var document = this._document;
    if (!document._id) {
        document._id = Math.floor(Math.random() * 500000) + '-' + Math.floor(Math.random() * 500000);
    }
    return this._session._protocol.crudInsert(this._session, this._schema, this._collection, document);
};
