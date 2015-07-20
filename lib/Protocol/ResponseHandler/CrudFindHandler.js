"use strict";

var Messages = require('../Messages');
var Datatype = require('../Datatype');
var ResponseHandler = require('./ResponseHandler.js');

/**
 *
 * @param rowcb Callback invoked for each row with an array of fields as single argument
 * @param metacb Optional callback involved when meta data received
 * @constructor
 */
function CrudFindHandler(rowcb, metacb) {
    ResponseHandler.call(this);

    this._meta = [];
    this._metacb = metacb;
    this._rowcb = rowcb;
}

module.exports = CrudFindHandler;

CrudFindHandler.prototype = Object.create(ResponseHandler.prototype);

CrudFindHandler.prototype[Messages.ServerMessages.SQL_COLUMN_META_DATA] = function (message, queueDone) {
    // TODO: Do we have to keep the full meta data here, type might be enough
    this._meta.push(message);
    if (this._metacb) {
        this._metacb(message);
    }
    return;
};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_ROW] = function (message, queueDone) {
    var row = [];
    var self = this;

    message.field.forEach(function (column, id) {
        var type = self._meta[id].type;
        row.push(JSON.parse(Datatype.decodeField(type, column)));
    });
    this._rowcb(row);
};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_RESULT_FETCH_DONE] = function (message, queueDone) {
};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = function (message, queueDone) {
    queueDone();
    this._resolve();
};
