"use strict";

var Messages = require('../Messages');
var ResponseHandler = require('./ResponseHandler.js');

function StmtExecuteOkHandler() {
    ResponseHandler.call(this);
}
module.exports = StmtExecuteOkHandler;

StmtExecuteOkHandler.prototype = Object.create(ResponseHandler.prototype);

StmtExecuteOkHandler.prototype[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = function (message, queueDone) {
    queueDone();
    this._resolve(message);
};

StmtExecuteOkHandler.prototype[Messages.ServerMessages.NOTICE] = function (message) {
    var Protocol = require('../');
    var notice = Protocol.decodeNotice(message);
    console.log("Notice in StmtExecuteOkHandler");
    console.log(notice);
};
