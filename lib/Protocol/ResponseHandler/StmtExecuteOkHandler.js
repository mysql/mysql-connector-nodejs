"use strict";

var Messages = require('../Messages');
var ResponseHandler = require('./ResponseHandler.js');

function StmtExecuteOkHandler() {
    this._notices = [];
    ResponseHandler.call(this);
}
module.exports = StmtExecuteOkHandler;

StmtExecuteOkHandler.prototype = Object.create(ResponseHandler.prototype);

StmtExecuteOkHandler.prototype[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = function (message, queueDone) {
    queueDone();
    // TODO - This leaks too many implementation details, we should translate this to something nicer
    // i.e. {
    //          stateChange: {
    //              generatedInsertId: 23,
    //              affectedRos: 23
    //          },
    //          warnings: [
    //              'foobar'
    //          ]
    //       }
    this._resolve(this._notices);
};

StmtExecuteOkHandler.prototype[Messages.ServerMessages.NOTICE] = function (message) {
    var Protocol = require('../');
    var notice = Protocol.decodeNotice(message);
    this._notices.push(notice);
};
