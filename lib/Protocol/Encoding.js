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

const Messages = require('./Messages'),
    Datatype = require('./Datatype'),
    protobuf = new (require('./protobuf.js'))(Messages);

exports.serverMessages = [];
exports.serverMessages[Messages.ServerMessages.OK] = "Mysqlx.Ok";
exports.serverMessages[Messages.ServerMessages.ERROR] = "Mysqlx.Error";
exports.serverMessages[Messages.ServerMessages.CONN_CAPABILITIES] = "Mysqlx.Connection.Capabilities";
exports.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
exports.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_OK] = "Mysqlx.Session.AuthenticateOk";
exports.serverMessages[Messages.ServerMessages.NOTICE] = "Mysqlx.Notice.Frame";
exports.serverMessages[Messages.ServerMessages.RESULTSET_COLUMN_META_DATA] = "Mysqlx.Resultset.ColumnMetaData";
exports.serverMessages[Messages.ServerMessages.RESULTSET_ROW] = "Mysqlx.Resultset.Row";
exports.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE] = "Mysqlx.Resultset.FetchDone";
exports.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_SUSPENDED] = "XXMysqlx.Resultset.FetchSuspended";
exports.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = "Mysqlx.Resultset.FetchDoneMoreResultsets";
exports.serverMessages[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = "Mysqlx.Sql.StmtExecuteOk";
exports.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_OUT_PARAMS] = "Mysqlx.ResultsetFetchDoneMoreOutParams";

exports.clientMessages = [];
exports.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_GET] = "Mysqlx.Connection.CapabilitiesGet";
exports.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_SET] = "Mysqlx.Connection.CapabilitiesSet";
exports.clientMessages[Messages.ClientMessages.CON_CLOSE] = "Mysqlx.Connection.Close";
exports.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_START] = "Mysqlx.Session.AuthenticateStart";
exports.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
exports.clientMessages[Messages.ClientMessages.SESS_RESET] = "Mysqlx.Session.Reset";
exports.clientMessages[Messages.ClientMessages.SESS_CLOSE] = "Mysqlx.Session.Close";
exports.clientMessages[Messages.ClientMessages.SQL_STMT_EXECUTE] = "Mysqlx.Sql.StmtExecute";
exports.clientMessages[Messages.ClientMessages.CRUD_FIND] = "Mysqlx.Crud.Find";
exports.clientMessages[Messages.ClientMessages.CRUD_INSERT] = "Mysqlx.Crud.Insert";
exports.clientMessages[Messages.ClientMessages.CRUD_UPDATE] = "Mysqlx.Crud.Update";
exports.clientMessages[Messages.ClientMessages.CRUD_DELETE] = "Mysqlx.Crud.Delete";
exports.clientMessages[Messages.ClientMessages.EXPECT_OPEN] = "XXMysqlx.Expect.Open";
exports.clientMessages[Messages.ClientMessages.EXPECT_CLOSE] = "XXMysqlx.Expect.Close";

/**
 * Encode data using protobuf and add MySQLx protocol header
 * @param messageId
 * @param data
 */
exports.encodeMessage = function (messageId, data, messages) {
    data = data || {};
    var buffer = protobuf.encode(messages[messageId], data, 5, 5);
    // The length we report to the server does not include the length of the length field
    buffer.writeUInt32LE(buffer.length - 4, 0);
    buffer[4] = messageId;
    return buffer;
};

exports.decodeMessage = function (data, offset, messages) {
    // The length reported by the server does not include the length of the length field
    var payloadLen = data.readUInt32LE(offset) + 4;
    var slice = data.slice(offset + 5, offset + payloadLen);

    var messageId = data[offset + 4];
    var messageName = messages[messageId];

    var decoded = protobuf.decode(messageName, slice);

    return {
        payloadLen: payloadLen,
        messageId: messageId,
        messageName: messageName,
        decoded: decoded
    };
};

var noticeDecoders = {
    1: "Mysqlx.Notice.Warning",
    2: "Mysqlx.Notice.SessionVariableChanged",
    3: "Mysqlx.Notice.SessionStateChanged"
};

const sessionStateParameters = {};
Object.getOwnPropertyNames(Messages.messages[noticeDecoders[3]].enums.Parameter).forEach((name) => {
    sessionStateParameters[Messages.messages[noticeDecoders[3]].enums.Parameter[name]] = name;
});

exports.decodeNotice = function (notice) {
    let retval = {
        type: notice.type,
        name: noticeDecoders[notice.type],
        notice: protobuf.decode(noticeDecoders[notice.type], notice.payload)
    };

    if (notice.type === 3) {
        retval.notice.paramName = sessionStateParameters[retval.notice.param];
    }

    if (retval.notice.value) {
        retval.notice.value = Datatype.decodeScalar(retval.notice.value);
    }

    return retval;
};

