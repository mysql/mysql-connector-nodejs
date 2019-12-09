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

// TODO - Bad dependency for Client.serverGoneMessageId
const Client = require('../Client');
const Mysqlx = require('../Protobuf/Adapters/Mysqlx');
const Notice = require('../Protobuf/Adapters/Notice');
const ServerMessages = require('../Protobuf/Stubs/mysqlx_pb').ServerMessages;

/**
 * Abstract prototype for a ResponseHandler
 *
 * Each inherited object should add methods for the messages they want to handle. Common utility functions
 * are provided from here.
 *
 * @private
 * @constructor
 */
function BaseHandler () {
    this._resolve = null;
    this._fail = null;
    this._notices = [];
}

/**
 * Directly send a message to the server, without adding to the queue or returning a promise.
 *
 * @param stream {Stream}
 * @param buffer {Buffer} Ready packet, will be sent as is
 */
BaseHandler.prototype.sendDirect = function (stream, buffer) {
    stream.write(buffer);
};

/**
 * Quese the handler, creates our promise and sends the message
 * @param queue {WorkQueue}
 * @param stream {Stream}
 * @param buffer {Buffer} Ready packet, will be sent as is
 * @returns {Promise}
 */
BaseHandler.prototype.sendMessage = function (queue, stream, buffer) {
    var self = this;

    return new Promise((resolve, reject) => {
        self._resolve = resolve;
        self._fail = reject;

        var entry = function (message, queueDone) {
            if (message.id === Client.serverGoneMessageId) {
                // TODO: This needs a way better handling approach for this, probably the Queue has to learn about this
                queueDone();
                return reject(new Error('The server has gone away'));
            }

            if (!self[message.id]) {
                queueDone();
                return reject(new Error(`Unexpected message ${message.id}`));
            }

            self[message.id](message.payload, queueDone);
        };

        queue.push(entry);
        self.sendDirect(stream, buffer);
    });
};

BaseHandler.prototype[ServerMessages.Type.NOTICE] = function (payload) {
    this._notices.push(Notice.decodeFrame(payload));
};

/**
 * Common handler for errors.
 *
 * If a handler wants to handle these differently they can do by overriding
 *
 * @param message
 */
BaseHandler.prototype[ServerMessages.Type.ERROR] = function (payload, queueDone) {
    queueDone();

    const serverError = Mysqlx.decodeError(payload);
    const error = new Error(serverError.msg);
    error.info = serverError;

    this._fail(error);
};

/**
 * common handler invoked when the connection terminates.
 *
 * If a Handler wants to react it can override, while there is no guarantee this will be called for all queued handlers
 */
BaseHandler.prototype.close = function () {
    this._fail(new Error('The server has gone away'));
};

module.exports = BaseHandler;
