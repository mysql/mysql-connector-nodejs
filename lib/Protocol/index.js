"use strict";

var Messages = require('./Messages');
var protobuf = new (require('./protobuf.js'))(Messages);
var WorkQueue = require('./../WorkQueue');
var handlers = require('./ResponseHandler');

/**
 * Main Protocol class
 * @param stream {stream}
 * @constructor
 */
function Protocol(stream) {
    this._stream = stream;

    this._workQueue = new WorkQueue();

    // TODO - This doesn't belong here, maybe into Messages?

    this.serverMessages = {};
    this.serverMessages[Messages.ServerMessages.OK] = "Mysqlx.Ok";
    this.serverMessages[Messages.ServerMessages.ERROR] = "Mysqlx.Error";

    this.serverMessages[Messages.ServerMessages.CONN_CAPABILITIES] = "Mysqlx.Connection.Capabilities";

    this.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
    this.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_OK] = "Mysqlx.Session.AuthenticateOk";
    this.serverMessages[Messages.ServerMessages.SESS_AUTHENTICATE_FAIL] = "Mysqlx.Session.AuthenticateFail";

    this.serverMessages[Messages.ServerMessages.NOTICE] = "Mysqlx.Notice";

    this.serverMessages[Messages.ServerMessages.SQL_COLUMN_META_DATA] = "Mysqlx.Sql.ColumnMetaData";
    this.serverMessages[Messages.ServerMessages.SQL_ROW] = "Mysqlx.Sql.Row";
    this.serverMessages[Messages.ServerMessages.SQL_RESULT_FETCH_DONE] = "Mysqlx.Sql.ResultFetchDone";
    this.serverMessages[Messages.ServerMessages.SQL_RESULT_FETCH_SUSPENDED] = "XXXX_FETCH_SUSPENDED_XXXX";
    this.serverMessages[Messages.ServerMessages.SQL_RESULT_FETCH_DONE_MORE_RESULTSETS] = "Mysqlx.Sql.ResultFetchDoneMoreResultsets";

    this.serverMessages[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = "Mysqlx.Sql.StmtExecuteOk";

    this.clientMessages = {};
    this.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_GET] = "Mysqlx.Connection.CapabilitiesGet";
    this.clientMessages[Messages.ClientMessages.CON_CAPABILITIES_SET] = "Mysqlx.Connection.CapabilitiesSet";
    this.clientMessages[Messages.ClientMessages.CON_CLOSE] = "Mysqlx.Connection.Close";
    this.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_START] = "Mysqlx.Session.AuthenticateStart";
    this.clientMessages[Messages.ClientMessages.SESS_AUTHENTICATE_CONTINUE] = "Mysqlx.Session.AuthenticateContinue";
    this.clientMessages[Messages.ClientMessages.SQL_PREPARE_STMT] = "Mysqlx.Sql.PrepareStmt";
    this.clientMessages[Messages.ClientMessages.SQL_PREPARED_STMT_EXECUTE] = "Mysqlx.Sql.PreparedStmtExecute";
    this.clientMessages[Messages.ClientMessages.SQL_CURSOR_FETCH_ROWS] = "Mysqlx.Sql.CursorFetchRows";
    this.clientMessages[Messages.ClientMessages.SQL_CURSOR_FETCH_META_DATA] = "Mysqlx.Sql.CursorFetchMetaData";
    this.clientMessages[Messages.ClientMessages.SQL_CURSOR_CLOSE] = "Mysqlx.Sql.CursorClose";
    this.clientMessages[Messages.ClientMessages.SQL_CURSORS_POLL] = "Mysqlx.Sql.CursorsPoll";
    this.clientMessages[Messages.ClientMessages.SQL_STMT_EXECUTE] = "Mysqlx.Sql.StmtExecute";
    this.clientMessages[Messages.ClientMessages.CRUD_PREPARE_FIND] = "Mysqlx.Crud.PrepareFind";
    this.clientMessages[Messages.ClientMessages.CRUD_PREPARE_INSERT] = "Mysqlx.Crud.PrepareInsert";
    this.clientMessages[Messages.ClientMessages.CRUD_PREPARE_UPDATE] = "Mysqlx.Crud.PrepareUpdate";
    this.clientMessages[Messages.ClientMessages.CRUD_PREPARE_DELETE] = "Mysqlx.Crud.PrepareDelete";
    this.clientMessages[Messages.ClientMessages.CRUD_FIND] = "Mysqlx.Crud.Find";
    this.clientMessages[Messages.ClientMessages.CRUD_INSERT] = "Mysqlx.Crud.Insert";
    this.clientMessages[Messages.ClientMessages.CRUD_UPDATE] = "Mysqlx.Crud.Update";
    this.clientMessages[Messages.ClientMessages.CRUD_DELETE] = "Mysqlx.Crud.Delete";
    this.clientMessages[Messages.ClientMessages.SQL_PREPARED_STMT_CLOSE] = "Mysqlx.Sql.PreparedStmtClose";
    this.clientMessages[Messages.ClientMessages.SESS_RESET] = "Mysqlx.Session.Reset";
    this.clientMessages[Messages.ClientMessages.SESS_CLOSE] = "Mysqlx.Session.Close";
    this.clientMessages[Messages.ClientMessages.EXPECT_OPEN] = "XXEXPECTATIONS_OPEN_NOT_YET";
    this.clientMessages[Messages.ClientMessages.EXPECT_CLOSE] = "XXEXPECTATIONS_CLOSE_NOT_YET";


    var self = this;
    this._stream.on('data', function (data) { return self.handleServerMessage(data); });
    this._stream.on('close', function () { return self.handleServerClose(); });
}

module.exports = Protocol;

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

Protocol.prototype.handleServerMessage = function (message) {
    var payloadLen = 0;
    for (var offset = 0; offset < message.length; offset += payloadLen) {
        var current = this.decodeMessage(message, offset);

        if (current.messageId == Messages.ServerMessages.NOTICE || current.messageId == Messages.ServerMessages.PARAMETER_CHANGED_NOTIFICATION) {
            console.log("Need to handle out-of-band message!");
            throw new Error("Need to handle out-of-band message!");
        }

        this._workQueue.process(current);
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

Protocol.prototype.crudInsert = function (session, schema, collection, document) {
    var dt = require('./Datatype');

    var data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: 1, /* Document */
        projection: [

        ],
        row: {
            field: [
                dt.encode(JSON.stringify(document))
            ]
        }
    };

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_INSERT, data);

    var handler = new handlers.StmtExecuteOkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Protocol.prototype.crudFind = function (session, schema, collection, rowcb, metacb) {
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

    var buffer = this.encodeMessage(Messages.ClientMessages.CRUD_FIND, data);

    var handler = new handlers.CrudFindHandler(rowcb, metacb);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

