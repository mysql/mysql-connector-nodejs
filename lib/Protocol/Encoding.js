/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
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
 * @private
 */
exports.encodeMessage = function (messageId, data, messages) {
    data = data || {};
    var buffer = protobuf.encode(messages[messageId], data, 5, 5);
    // The length we report to the server does not include the length of the length field
    buffer.writeUInt32LE(buffer.length - 4, 0);
    buffer[4] = messageId;
    return buffer;
};

exports.decodeMessageHeader = function (data, offset) {
    if (data.length < offset + 4 /* UInt32 size */ + 1 /* type flag size */) {
        return false;
    }

    return {
        // The length reported by the server does not include the length of the length field
        payloadLen: data.readUInt32LE(offset) + 4,
        messageId: data[offset + 4]
    };
};

exports.decodeMessage = function (data, offset, messages) {
    // TODO: offset should always be 0 and the caller slice as needed
    const header = exports.decodeMessageHeader(data, offset);
    if (!header) {
        throw new RangeError("Header could not be read");
    }
    if (data.length < offset + header.payloadLen) {
        throw new RangeError("Incomplete package");
    }
    const slice = data.slice(offset + 5, offset + header.payloadLen);
    const messageName = messages[header.messageId];

    const decoded = protobuf.decode(messageName, slice);

    return {
        payloadLen: header.payloadLen,
        messageId: header.messageId,
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

