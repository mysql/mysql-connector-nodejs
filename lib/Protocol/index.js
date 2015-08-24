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

var Messages = require('./Messages');
var protobuf = new (require('./protobuf.js'))(Messages);
var WorkQueue = require('./../WorkQueue');
var handlers = require('./ResponseHandler');
var Expressions = require('../Expressions');
var DataType = require('./Datatype');

/**
 * Main Protocol class
 * @param stream {stream}
 * @constructor
 */
function Protocol(stream) {
    this._stream = stream;

    this._workQueue = new WorkQueue();

    var self = this;
    this._stream.on('data', function (data) { return self.handleServerMessage(data); });
    this._stream.on('close', function () { return self.handleServerClose(); });
}

module.exports = Protocol;

// TODO - This doesn't belong here, maybe into Messages?
Protocol.prototype.serverMessages = {};
Protocol.prototype.serverMessages[Messages.ServerMessages.OK] = "Mysqlx.Ok";
Protocol.prototype.serverMessages[Messages.ServerMessages.ERROR] = "Mysqlx.Error";
Protocol.prototype.serverMessages[Messages.ServerMessages.CONN_CAPABILITIES] = "Mysqlx.Connection.Capabilities";
Protocol.prototype.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
Protocol.prototype.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_OK] = "Mysqlx.Session.AuthenticateOk";
Protocol.prototype.serverMessages[Messages.ServerMessages.NOTICE] = "Mysqlx.Notice.Frame";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_COLUMN_META_DATA] = "Mysqlx.Resultset.ColumnMetaData";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_ROW] = "Mysqlx.Resultset.Row";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE] = "Mysqlx.Resultset.FetchDone";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_SUSPENDED] = "XXMysqlx.Resultset.FetchSuspended";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = "Mysqlx.Resultset.FetchDoneMoreResultsets";
Protocol.prototype.serverMessages[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = "Mysqlx.Sql.StmtExecuteOk";
Protocol.prototype.serverMessages[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_OUT_PARAMS] = "Mysqlx.ResultsetFetchDoneMoreOutPArams";

Protocol.prototype.clientMessages = {};
Protocol.prototype.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_GET] = "Mysqlx.Connection.CapabilitiesGet";
Protocol.prototype.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_SET] = "Mysqlx.Connection.CapabilitiesSet";
Protocol.prototype.clientMessages[Messages.ClientMessages.CON_CLOSE] = "Mysqlx.Connection.Close";
Protocol.prototype.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_START] = "Mysqlx.Session.AuthenticateStart";
Protocol.prototype.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
Protocol.prototype.clientMessages[Messages.ClientMessages.SESS_RESET] = "Mysqlx.Session.Reset";
Protocol.prototype.clientMessages[Messages.ClientMessages.SESS_CLOSE] = "Mysqlx.Session.Close";
Protocol.prototype.clientMessages[Messages.ClientMessages.SQL_STMT_EXECUTE] = "Mysqlx.Sql.StmtExecute";
Protocol.prototype.clientMessages[Messages.ClientMessages.CRUD_FIND] = "Mysqlx.Crud.Find";
Protocol.prototype.clientMessages[Messages.ClientMessages.CRUD_INSERT] = "Mysqlx.Crud.Insert";
Protocol.prototype.clientMessages[Messages.ClientMessages.CRUD_UPDATE] = "Mysqlx.Crud.Update";
Protocol.prototype.clientMessages[Messages.ClientMessages.CRUD_DELETE] = "Mysqlx.Crud.Delete";
Protocol.prototype.clientMessages[Messages.ClientMessages.EXPECT_OPEN] = "XXMysqlx.Expect.Open";
Protocol.prototype.clientMessages[Messages.ClientMessages.EXPECT_CLOSE] = "XXMysqlx.Expect.Close";


Protocol.updateOperations = {
    "SET": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.SET,
    "ITEM_REMOVE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_REMOVE,
    "ITEM_SET": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_SET,
    "ITEM_REPLACE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_REPLACE,
    "ITEM_MERGE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_MERGE,
    "ARRAY_INSERT": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ARRAY_INSERT,
    "ARRAY_APPEND": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ARRAY_APPEND
};

// TODO - This is a hack, see also TODO in ResponseHandler.prototype.sendMessage
Protocol.serverGoneMessageId = -1;

/**
 * Encode data using protobuf and add MySQLx protocol header
 * @param messageId
 * @param data
 */
Protocol.prototype.encodeMessage = function (messageId, data, messages) {
    messages = messages || this.clientMessages;
    data = data || {};
    var buffer = protobuf.encode(messages[messageId], data, 5, 5);
    // The length we report to the server does not include the length of the length field
    buffer.writeUInt32LE(buffer.length - 4, 0);
    buffer[4] = messageId;
    return buffer;
};

Protocol.prototype.decodeMessage = function (data, offset, messages) {
    messages = messages || this.serverMessages;

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

Protocol.decodeNotice = function (notice) {
    var retval = {
        type: notice.type,
        name: noticeDecoders[notice.type],
        notice: protobuf.decode(noticeDecoders[notice.type], notice.payload)
    };

    if (retval.notice.value) {
        retval.notice.value = DataType.decodeScalar(retval.notice.value);
    }

    return retval;
};

Protocol.prototype.handleServerMessage = function (message) {
    var payloadLen = 0;
    for (var offset = 0; offset < message.length; offset += payloadLen) {
        var current = this.decodeMessage(message, offset);

        if (current.messageId === Messages.ServerMessages.NOTICE && current.decoded.scope === Messages.messages['Mysqlx.Notice.Frame'].enums.Scope.GLOBAL) {
            console.log("TODO: Need to handle out of band message");
            console.log(Protocol.decodeNotice(current.decoded));
        } else {
            this._workQueue.process(current);
        }
        payloadLen = current.payloadLen;
    }
};

Protocol.prototype.handleServerClose = function () {
    while (this._workQueue.hasMore()) {
        this._workQueue.process(Protocol.serverGoneMessageId);
    }
};


Protocol.prototype.capabilitiesGet = function (properties) {
    var buffer = this.encodeMessage(Messages.ClientMessages.CON_CAPABILITIES_GET, {});

    var handler = new handlers.CapabilitiesGetHandler(this);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};


Protocol.prototype.authenticate = function (authenticator) {
    var data = {
        mech_name: authenticator.name,
        auth_data: authenticator.getInitialAuthData()
    };

    var buffer = this.encodeMessage(Messages.ClientMessages.SESS_AUTHENTICATE_START, data);

    var handler = new handlers.AuthenticationHandler(authenticator, this);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.authenticateContinue = function (auth_data, handler) {
    var data = {
        auth_data: auth_data
    };
    var buffer = this.encodeMessage(Messages.ClientMessages.SESS_AUTHENTICATE_CONTINUE, data);
    handler.sendDirect(this._stream, buffer);
};

Protocol.prototype.close = function () {
    var buffer = this.encodeMessage(Messages.ClientMessages.CON_CLOSE);
    var handler = new handlers.OkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.crudInsert = function (schema, collection, documents) {
    var dt = require('./Datatype');

    if (!documents.length) {
        throw new Error("No document provided for Crud::Insert");
    }

    var data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: 1, /* Document */
        projection: [],
        row: []
    };
    documents.forEach(function (doc) {
        data.row.push({
            field: [{
                type: Messages.messages['Mysqlx.Expr.Expr'].enums.Type.LITERAL,
                literal: dt.encodeScalar(JSON.stringify(doc))
            }]
        });
    });

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_INSERT, data);

    var handler = new handlers.StmtExecuteOkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.crudFind = function (session, schema, collection, criteria, limit, rowcb, metacb) {
    var data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: 1, /*Document*/
        projection: [],
        order: [],
        grouping: []
    };

    if (limit && limit.count) {
        data.limit = {
            row_count: limit.count
        };
        if (limit.offset) {
            data.limit.offset = limit.offset;
        }
    }

    if (criteria && typeof(criteria) ==  "string") {
        criteria = Expressions.parse(criteria);
    }
    if (criteria) {
        data.criteria = criteria;
    }

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_FIND, data);

    var handler = new handlers.SqlResultHandler(rowcb, metacb);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.crudModify = function (session, schema, collection, criteria, operations) {
    var data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: 1, /*Document*/
        operation: operations
    };

    if (criteria && typeof(criteria) ==  "string") {
        criteria = Expressions.parse(criteria);
    }
    if (criteria) {
        data.criteria = criteria;
    }

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_UPDATE, data);

    var handler = new handlers.StmtExecuteOkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.crudRemove = function (session, schema, collection, criteria, limit, rowcb, metacb) {
    var data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: 1, /*Document*/
        order: []
    };

    if (limit && limit.count) {
        data.limit = {
            row_count: limit.count
        };
        if (limit.offset) {
            data.limit.offset = limit.offset;
        }
    }

    if (criteria && typeof(criteria) ==  "string") {
        criteria = Expressions.parse(criteria);
    }
    if (criteria) {
        data.criteria = criteria;
    }

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_DELETE, data);

    var handler = new handlers.StmtExecuteOkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.sqlStmtExecute = function (stmt, args, rowcb, metacb, namespace) {
    namespace = namespace || "sql";
    var data = {
        namespace: namespace,
        stmt: stmt
    };
    if (args) {
        data.args = [];
        args.forEach(function (arg) {
            data.args.push(DataType.encode(arg))
        });
    }

    var buffer = this.encodeMessage(Messages.ClientMessages.SQL_STMT_EXECUTE, data);

    var handler = new handlers.SqlResultHandler(rowcb, metacb);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};
