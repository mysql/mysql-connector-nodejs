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

'use strict';

const ClientMessages = require('./Stubs/mysqlx_pb').ClientMessages;
const Connection = require('./Encoder/Connection');
const Crud = require('./Encoder/Crud');
const Encoding = require('./Encoding');
const Messages = require('./Messages');
const Session = require('./Encoder/Session');
const Sql = require('./Encoder/Sql');
const WorkQueue = require('../WorkQueue');
const fs = require('../Adapters/fs');
const getServerCipherSuite = require('./Util/getServerCipherSuite');
const handlers = require('./ResponseHandler');
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
    this._danglingFragment = false;

    _addSocketEventListeners.call(this, this._stream);
}

module.exports = Client;

function _addSocketEventListeners (stream) {
    stream.on('data', data => this.handleNetworkFragment(data));
    stream.on('close', () => this.handleServerClose());
}

// TODO - This is a hack, see also TODO in ResponseHandler.prototype.sendMessage
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

Client.prototype.decodeMessage = function (data, offset, messages) {
    messages = messages || Encoding.serverMessages;
    try {
        return Encoding.decodeMessage(data, offset, messages);
    } catch (err) {
        if (offset === 0 && messages === Encoding.serverMessages) {
            // To help newcomers we try to detect old MySQL servers
            if (data.readInt32LE(0) + 4 <= data.length && // Package length
                data[3] === 0 && // Package number
                data[4] === 10 // Protocol version
            ) {
                const versionEnd = data.indexOf('\0', 5);
                const version = data.toString('ascii', 5, versionEnd);
                throw new Error("The server you're connected to is no MySQL server speaking X Protocol. It could be MySQL " + version + ' speaking the classic protocol');
            }
        }
        throw err;
    }
};

/**
 * Handle an individual message
 *
 * The passed buffer must only contain the single message
 *
 * @param {Buffer} message
 */
Client.prototype.handleServerMessage = function (message) {
    const current = this.decodeMessage(message, 0);

    if (current.messageId === Messages.ServerMessages.NOTICE && current.decoded.scope === Messages.messages['Mysqlx.Notice.Frame'].enums.Scope.GLOBAL) {
        console.log('TODO: Need to handle out of band message');
        console.log(Encoding.decodeNotice(current.decoded));
    } else {
        this._workQueue.process(current);
    }
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
    let offset = 0;

    if (this._danglingFragment) {
        let header = Encoding.decodeMessageHeader(this._danglingFragment, 0);
        if (!header) {
            // The dangling frame is too small for even having a header
            // try to get 5 bytes, the size of our header
            // If this fails somebody is fooling us and Buffer will
            // throw an Error
            header = Encoding.decodeMessageHeader(Buffer.concat([this._danglingFragment, fragment.slice(0, 5 - this._danglingFragment.length)], 5), 0);
        }

        offset = header.payloadLen - this._danglingFragment.length;

        // Now we build a Buffer with the complete message, which can be handled
        const message = Buffer.concat([
            this._danglingFragment,
            fragment.slice(0, offset)
        ], header.payloadLen);

        this.handleServerMessage(message);
        this._danglingFragment = false;
    }

    while (offset < fragment.length) {
        const header = Encoding.decodeMessageHeader(fragment, offset);

        if (header && fragment.length >= offset + header.payloadLen) {
            // All is fine we have the complete message
            this.handleServerMessage(fragment.slice(offset, offset + header.payloadLen));
        } else {
            this._danglingFragment = fragment.slice(offset);
        }
        offset += header ? header.payloadLen : fragment.length;
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
    const handler = new handlers.CapabilitiesGetHandler(this);

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
    const handler = new handlers.OkHandler(this);

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
    const handler = new handlers.AuthenticationHandler(authenticator, this);

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

    const handler = new handlers.SqlResultHandler();

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

    const handler = new handlers.SqlResultHandler(resultSetCursor, metadataCursor);

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

    const handler = new handlers.SqlResultHandler();

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

    const handler = new handlers.SqlResultHandler();

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

    const handler = new handlers.SqlResultHandler(resultSetCursor, metadataCursor);

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
    const handler = new handlers.OkHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};
