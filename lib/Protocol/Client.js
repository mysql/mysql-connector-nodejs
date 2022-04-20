/*
 * Copyright (c) 2016, 2022, Oracle and/or its affiliates.
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

'use strict';

const AuthenticationHandler = require('./InboundHandlers/AuthenticationHandler');
const CapabilitiesGetHandler = require('./InboundHandlers/CapabilitiesGetHandler');
const ClientMessages = require('./Stubs/mysqlx_pb').ClientMessages;
const Connection = require('./OutboundHandlers/Connection');
const Crud = require('./OutboundHandlers/Crud');
const Expect = require('./OutboundHandlers/Expect');
const NoticeStub = require('./Stubs/mysqlx_notice_pb');
const OkHandler = require('./InboundHandlers/OkHandler');
const Prepare = require('./OutboundHandlers/Prepare');
const Session = require('./OutboundHandlers/Session');
const Sql = require('./OutboundHandlers/Sql');
const SqlResultHandler = require('./InboundHandlers/SqlResultHandler');
const WorkQueue = require('../WorkQueue');
const condition = require('./Wrappers/Messages/Expect/Condition');
const error = require('./Wrappers/Messages/Error');
const errors = require('../constants/errors');
const log = require('../logger');
const notice = require('./Wrappers/Messages/Notice/Frame');

const REQUIRES_REAUTH = {
    NO: 'NO',
    UNKNOWN: 'UNKNOWN',
    YES: 'YES'
};

/**
 * Main Protocol class
 * @param stream {stream}
 * @constructor
 * @private
 */
function Client (stream) {
    this._stream = stream;
    this._workQueue = new WorkQueue();
    this._danglingFragment = null;
    this._requiresAuthenticationAfterReset = REQUIRES_REAUTH.UNKNOWN;
}

module.exports = Client;

Client.prototype.getConnection = function () {
    return this._stream;
};

Client.prototype.setConnection = function (connection) {
    this._stream = connection;
    return this;
};

/**
 * Encode X protocol message (with header and payload).
 * @param {number} messageType - type of the message payload
 * @param {Buffer} data - raw payload data
 * @returns {Buffer} The full X protocol message buffer.
 */
Client.prototype.encodeMessage = function (messageType, data) {
    // The message must accommodate (besides payload size) additionally, 4
    // bytes for the header and 1 byte for the message id.
    // Since the entire buffer will be written, we should use
    // "Buffer.allocUnsafe()" instead of "Buffer.alloc()" because it is faster.
    // https://nodejs.org/docs/v14.0.0/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe
    const buffer = Buffer.allocUnsafe(data.length + 5);

    data.copy(buffer, 5);

    // The total payload size should not include the size of the length header field.
    buffer.writeUInt32LE(buffer.length - 4, 0);
    buffer[4] = messageType;

    return buffer;
};

Client.prototype.decodeMessage = function (data) {
    // Check if the connection is using the old MySQL wire protocol.
    const isWireProtocol = data.readInt32LE(0) + 4 <= data.length && // package length
        data[3] === 0 && // package number
        data[4] === 10; // protocol version

    if (isWireProtocol) {
        throw new Error(errors.MESSAGES.ER_CLIENT_NO_X_PROTOCOL);
    }

    const header = this.decodeMessageHeader(data);

    if (data.length < header.packetLength) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_INCOMPLETE_PROTOCOL_MESSAGE);
    }

    const payload = data.slice(5, header.packetLength);

    return { id: header.messageId, payload };
};

Client.prototype.decodeMessageHeader = function (data) {
    if (data.length < 4 /* header size */ + 1 /* type flag size */) {
        throw new Error(errors.MESSAGES.ER_X_CLIENT_UNKNOWN_PROTOCOL_HEADER);
    }

    return {
        // The length reported by the server does not include the length of the header.
        packetLength: data.readUInt32LE(0) + 4,
        messageId: data[4]
    };
};

/**
 * Handle an individual message
 *
 * The passed buffer must only contain the single message
 *
 * @param {Buffer} message
 */
Client.prototype.handleServerMessage = function (message) {
    const decoded = this.decodeMessage(message);

    if (decoded.id === notice.MESSAGE_ID) {
        // TODO(Rui): Non-global notices are being decoded twice (in the handler as well).
        // This will change in an upcoming refactoring plan.
        const frame = notice.deserialize(decoded.payload);

        if (frame.getScopeId() === NoticeStub.Frame.Scope.GLOBAL) {
            log('protocol:inbound:Mysqlx.Notice').info('Frame', frame);

            if (frame.getTypeId() === NoticeStub.Frame.Type.WARNING) {
                const payload = frame.getPayload();

                if (payload.getLevelId() === NoticeStub.Warning.Level.ERROR) {
                    const error = new Error(errors.MESSAGES[errors[payload.getCode()]]);
                    this._stream.emit('error', error);
                }
            }

            return;
        }
    }

    this._workQueue.process(decoded);
};

/**
 * This is the entry point for everything from the network
 *
 * Here we split multiple messages from one network packet and and reassemble
 * fragmented pieces. Each individual message is passed over to
 * handleServerMessage.
 *
 * @param {Buffer} fragment
 */
Client.prototype.handleNetworkFragment = function (fragment) {
    if (this._danglingFragment) {
        // The previous fragment contained an incomplete message that requires data from the current fragment.
        fragment = Buffer.concat([this._danglingFragment, fragment], this._danglingFragment.length + fragment.length);
    }

    // X Protocol header length = 4 bytes.
    const headerLength = 4;

    let offset = 0;

    while (offset < fragment.length) {
        // Work on the scope of a single message.
        const chunk = fragment.slice(offset);

        if (chunk.length < headerLength) {
            // There is no reason for this to happen, but we can play it safe.
            this._danglingFragment = chunk;
            return;
        }

        // The value encoded in the message length segment does not include the size
        // of that same segment.
        const payloadLength = chunk.readUInt32LE(0) + headerLength;

        if (chunk.length < payloadLength) {
            // The message is still incomplete.
            this._danglingFragment = chunk;
            return;
        }

        this._danglingFragment = null;
        this.handleServerMessage(chunk.slice(0, payloadLength));

        if (chunk.length === payloadLength) {
            // The current chunk matches an entire message.
            return;
        }

        // The current chunk contains data from additional messages.
        // The next loop iteration should start from the beginning of the next one.
        offset += payloadLength;
    }
};

Client.prototype.handleServerClose = function () {
    while (this._workQueue.hasMore()) {
        this._workQueue.process({ id: error.SERVER_GONE });
    }
};

Client.prototype.isRunning = function () {
    return this._workQueue.hasMore();
};

/**
 * Send a Mysqlx.Connection.CapabilitiesGet message to the server.
 * @private
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.capabilitiesGet = function () {
    const messageType = ClientMessages.Type.CON_CAPABILITIES_GET;
    const protobuf = this.encodeMessage(messageType, Connection.encodeCapabilitiesGet());
    const handler = new CapabilitiesGetHandler(this);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Connection.CapabilitiesSet message to the server.
 * @private
 * @param {Object} properties - connection properties
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.capabilitiesSet = function (properties) {
    const messageType = ClientMessages.Type.CON_CAPABILITIES_SET;
    const protobuf = this.encodeMessage(messageType, Connection.encodeCapabilitiesSet(properties));
    const handler = new OkHandler(this);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Session.AuthenticateStart message to the server.
 * @private
 * @param {IAuthenticator} authenticator - authenticator instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.authenticate = function (authenticator) {
    // cache the authentication plugin
    this._authenticator = authenticator;

    const messageType = ClientMessages.Type.SESS_AUTHENTICATE_START;
    const protobuf = this.encodeMessage(messageType, Session.encodeAuthenticateStart(authenticator.getName(), authenticator.getInitialAuthData()));
    const handler = new AuthenticationHandler(authenticator, this);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Session.AuthenticateContinue message to the server.
 * @private
 * @param {Buffer} data - raw connection data
 * @param {AuthenticationHandler} handler - active authentication handler
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.authenticateContinue = function (data, handler) {
    const messageType = ClientMessages.Type.SESS_AUTHENTICATE_CONTINUE;
    const protobuf = this.encodeMessage(messageType, Session.encodeAuthenticateContinue(data));

    handler.sendDirect(this._stream, protobuf);
};

/**
 * Send a Mysqlx.Crud.Insert message to the server.
 * @private
 * @param {module:CollectionAdd|module:TableInsert} query - the operation instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.crudInsert = function (query) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.CRUD_INSERT, Crud.encodeInsert(query));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Crud.Find message to the server.
 * @private
 * @param {Object} query - the query data
 * @param {Function} resultSetCursor
 * @param {Function} metadataCursor
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.crudFind = function (query, resultSetCursor, metadataCursor) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.CRUD_FIND, Crud.encodeFind(query));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler(resultSetCursor, metadataCursor);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Crud.Update message to the server.
 * @private
 * @param {module:CollectionModify|module:TableUpdate} query - the operation instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.crudModify = function (query) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.CRUD_UPDATE, Crud.encodeUpdate(query));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Crud.Delete message to the server.
 * @private
 * @param {module:CollectionRemove|module:TableDelete} query - the operation instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.crudRemove = function (query) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.CRUD_DELETE, Crud.encodeDelete(query));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Sql.StmtExecute message to the server.
 * @private
 * @param {StmtExecute} query - the operation instance
 * @param {Function} resultSetCursor
 * @param {Function} metadataCursor
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.sqlStmtExecute = function (query, resultSetCursor, metadataCursor) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.SQL_STMT_EXECUTE, Sql.encodeStmtExecute(query));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler(resultSetCursor, metadataCursor);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Prepare.Prepare message to the server.
 * @private
 * @param {Query} statement - the statement instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.prepare = function (statement) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.PREPARE_PREPARE, Prepare.encodePrepare(statement));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Prepare.Execute message to the server.
 * @private
 * @param {Query} statement - the statement instance
 * @param {Function} resultSetCursor
 * @param {Function} metadataCursor
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.prepareExecute = function (statement, resultSetCursor, metadataCursor) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.PREPARE_EXECUTE, Prepare.encodeExecute(statement));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new SqlResultHandler(resultSetCursor, metadataCursor);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Prepare.Deallocate message to the server.
 * @private
 * @param {Query} statement - the statement instance
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.deallocate = function (statement) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.PREPARE_DEALLOCATE, Prepare.encodeDeallocate(statement));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Session.Close message to the server.
 * @private
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.sessionClose = function () {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.SESS_CLOSE, Session.encodeClose());
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

/**
 * Send a Mysqlx.Session.Reset message to the server.
 * @private
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.sessionReset = function () {
    const reset = (options) => {
        let protobuf;

        try {
            protobuf = this.encodeMessage(ClientMessages.Type.SESS_RESET, Session.encodeReset(options));
        } catch (err) {
            return Promise.reject(err);
        }

        const handler = new OkHandler();

        return handler.sendMessage(this._workQueue, this._stream, protobuf);
    };

    if (this._requiresAuthenticationAfterReset === REQUIRES_REAUTH.NO) {
        return reset({ keepOpen: true });
    }

    if (this._requiresAuthenticationAfterReset === REQUIRES_REAUTH.YES) {
        return reset({ keepOpen: false }).then(() => this.authenticate(this._authenticator));
    }

    const expectations = [{
        condition: condition.ACTION.EXPECT_OP_SET,
        key: condition.TYPE.EXPECT_FIELD_EXIST,
        value: '6.1' // checks if SESS_RESET message supports the "keep_open" property
    }];

    return this.expectOpen(expectations)
        .then(() => reset({ keepOpen: true }))
        .then(() => this.expectClose())
        .then(() => {
            this._requiresAuthenticationAfterReset = REQUIRES_REAUTH.NO;
        })
        .catch(err => {
            if (err.info && err.info.code !== errors.ER_X_EXPECT_FIELD_EXISTS_FAILED) {
                throw err;
            }

            this._requiresAuthenticationAfterReset = REQUIRES_REAUTH.YES;

            return this.sessionReset();
        });
};

/**
 * Send a Mysqlx.Connection.Close message to the server.
 * @private
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.connectionClose = function () {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.CON_CLOSE, Connection.encodeClose());
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

Client.prototype.expectClose = function () {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.EXPECT_OPEN, Expect.encodeClose());
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler(this);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

Client.prototype.expectOpen = function (expectations) {
    let protobuf;

    try {
        protobuf = this.encodeMessage(ClientMessages.Type.EXPECT_OPEN, Expect.encodeOpen(expectations));
    } catch (err) {
        return Promise.reject(err);
    }

    const handler = new OkHandler(this);

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};
