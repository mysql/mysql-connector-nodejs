"use strict";

var Collection = require('./Collection'),
    DatabaseObject = require('./DatabaseObject');

function Schema(session, schema) {
    DatabaseObject.call(this, session, schema);
}

module.exports = Schema;

Schema.prototype = Object.create(DatabaseObject.prototype);

Schema.prototype.getName = function () {
    return this._schema;
};

Schema.prototype.getCollection = function (collection) {
    return new Collection(this._session, this, collection);
};

