function CollectionFind(session, schema, collection, query) {
    this._session = session;
    this._schema = schema;
    this._collection = collection;
    this._query = query;
    this._limit = null;
    this._bounds = [];
}

module.exports = CollectionFind;

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

CollectionFind.prototype.execute = function (rowcb) {
    return this
        ._session
        ._protocol
        .crudFind(this._session, this._schema.getName(), this._collection, this._query, this._limit, rowcb);
};
