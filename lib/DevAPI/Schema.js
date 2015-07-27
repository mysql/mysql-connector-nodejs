var Collection = require('./Collection');

function Schema(session, schema) {
    this._session = session;
    this._schema = schema;
}

module.exports = Schema;

Schema.prototype.getCollection = function (collection) {
    return new Collection(this._session, this._schema, collection);
};
