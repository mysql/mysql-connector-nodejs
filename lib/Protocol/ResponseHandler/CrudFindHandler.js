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

    this._metacb = metacb;
    this._rowcb = rowcb;
}

module.exports = CrudFindHandler;

CrudFindHandler.prototype = Object.create(ResponseHandler.prototype);

CrudFindHandler.prototype[Messages.ServerMessages.SQL_CURSOR_FETCH_META_DATA] = function (message, queueDone) {};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_COLUMN_META_DATA] = function (message, queueDone) {
    if (this._metacb) {
        this._metacb(message);
    }
    return;
};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_ROW]= function (message, queueDone) {
    var row = [];
    message.field.forEach(function (column) {
        // console.log(JSON.parse(Datatype.decodeAny(column))   );//.toString());
        row.push(JSON.parse(Datatype.decodeAny(column)));
    });
    this._rowcb(row);
};

CrudFindHandler.prototype[Messages.ServerMessages.SQL_CURSOR_FETCH_DONE] = function (message, queueDone) {
    queueDone();
    this._resolve();
};
