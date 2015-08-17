/*
 * Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

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
