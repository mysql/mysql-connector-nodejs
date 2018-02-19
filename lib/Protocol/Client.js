/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
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

const AuthenticationHandler = require('./ResponseHandlers/AuthenticationHandler');
const CapabilitiesGetHandler = require('./ResponseHandlers/CapabilitiesGetHandler');
const ClientMessages = require('./Protobuf/Stubs/mysqlx_pb').ClientMessages;
const Connection = require('./Protobuf/Adapters/Connection');
const Crud = require('./Protobuf/Adapters/Crud');
const OkHandler = require('./ResponseHandlers/OkHandler');
const Session = require('./Protobuf/Adapters/Session');
const Sql = require('./Protobuf/Adapters/Sql');
const SqlResultHandler = require('./ResponseHandlers/SqlResultHandler');
const WorkQueue = require('../WorkQueue');
const fs = require('../Adapters/fs');
const getServerCipherSuite = require('./Util/getServerCipherSuite');
const parseX509Bundle = require('./Util/parseX509Bundle');
const tls = require('tls');

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

    _addSocketEventListeners.call(this, this._stream);
}

module.exports = Client;

function _addSocketEventListeners (stream) {
    stream.on('data', data => this.handleNetworkFragment(data));
    stream.on('close', () => this.handleServerClose());
}

// TODO - This is a hack, see also TODO in BaseHandler.prototype.sendMessage
Client.serverGoneMessageId = -1;

Client.prototype.enableSSL = function (options) {
    const config = Object.assign({}, options, {
        ciphers: getServerCipherSuite(),
        rejectUnauthorized: false,
        socket: this._stream
    });

    if (typeof config.ca === 'string' && !config.ca.length) {
        return Promise.reject(new Error('CA value must not be empty string'));
    }

    if (typeof config.crl === 'string' && !config.crl.length) {
        return Promise.reject(new Error('CRL value must not be empty string'));
    }

    return this
        .capabilitiesSet({ tls: true })
        .then((res) => {
            if (!config.ca) {
                return;
            }

            return fs.readFile(config.ca, 'ascii');
        })
        .then(ca => {
            if (!ca || !config.crl) {
                return { ca };
            }

            return fs.readFile(config.crl, 'ascii').then(crl => ({ ca, crl }));
        })
        .then(security => new Promise((resolve, reject) => {
            delete config.ca;
            delete config.crl;

            if (security && security.ca) {
                // A CA file might contain a certificate chain/bundle.
                config.ca = parseX509Bundle(security.ca);
                config.rejectUnauthorized = true;
            }

            if (security && security.crl) {
                // A CRL does not contain a certificate chain/bundle.
                config.crl = security.crl;
            }

            this._stream = tls.connect(config, () => resolve(this._stream));
            this._stream.on('error', err => reject(err));
        }))
        .then(stream => {
            _addSocketEventListeners.call(this, stream);
            return true;
        })
        .catch(err => {
            const data = err.info;

            if (!data || !data.code || data.code !== 5001) {
                throw err;
            }

            const message = `The server's X plugin version does not support SSL. Please refer to https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.`;

            throw new Error(message);
        });
};

/**
 * Encode X protocol message (with header and payload).
 * @param {number} messageType - type of the message payload
 * @param {Buffer} data - raw payload data
 * @returns {Buffer} The full X protocol message buffer.
 */
Client.prototype.encodeMessage = function (messageType, data) {
    /* eslint-disable node/no-deprecated-api */
    const buffer = new Buffer(data.length + 5);
    /* eslint-enable node/no-deprecated-api */

    buffer.fill(0);
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
        throw new Error(`The server connection is not using the X Protocol. Make sure you
        are connecting to the correct port and using a MySQL 5.7.12 (or higher) server intance.`);
    }

    const header = this.decodeMessageHeader(data);

    if (data.length < header.packetLength) {
        throw new Error('The server message is incomplete.');
    }

    const payload = data.slice(5, header.packetLength);

    return { id: header.messageId, payload };
};

Client.prototype.decodeMessageHeader = function (data) {
    if (data.length < 4 /* header size */ + 1 /* type flag size */) {
        throw new Error('The server message contains an invalid header.');
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
    this._workQueue.process(this.decodeMessage(message));
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
        this._workQueue.process(Client.serverGoneMessageId);
    }
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
    const messageType = ClientMessages.Type.SESS_AUTHENTICATE_START;
    const protobuf = this.encodeMessage(messageType, Session.encodeAuthenticateStart(authenticator));
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
 * @param {CollectionAdd|TableInsert} query - the operation instance
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
 * Does something for each element in the result set.
 * @callback resultSetCursor
 * @param {Object|Array} item - document or row instance
 */

/**
 * Does something with the operation metada.
 * @callback metadataCursor
 * @param {Object} metadata - metadata object
 */

/**
 * Send a Mysqlx.Crud.Find message to the server.
 * @private
 * @param {Object} query - the query data
 * @param {resultSetCursor} resultSetCursor
 * @param {metadataCursor} metadataCursor
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
 * @param {CollectionModify|TableUpdate} query - the operation instance
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
 * @param {CollectionRemove|TableDelete} query - the operation instance
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
 * @param {resultSetCursor} resultSetCursor
 * @param {metadataCursor} metadataCursor
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
 * Send a Mysqlx.Sql.Close message to the server.
 * @private
 * @returns {Promise<Object>} A promise that resolves to an object describing the operation status.
 */
Client.prototype.close = function () {
    const messageType = ClientMessages.Type.CON_CLOSE;
    const protobuf = this.encodeMessage(messageType, Connection.encodeClose());
    const handler = new OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};
