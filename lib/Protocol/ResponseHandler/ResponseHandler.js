"use strict";

// TODO - Bad dependency for Protocol.serverGoneMessageId
var Protocol = require('../');
var Messages = require('../Messages');

/**
 * Abstract prototype for a ResponseHandler
 *
 * Each inherited object should add methods for the messages they want to handle. Common utility functions
 * are provided from here.
 *
 * @constructor
 */
function ResponseHandler() {
    this._resolve = null;
    this._fail = null;
}

module.exports = ResponseHandler;

/**
 * Directly send a message to the server, without adding to the queue or returning a promise.
 *
 * @param stream {Stream}
 * @param buffer {Buffer} Ready packet, will be sent as is
 */
ResponseHandler.prototype.sendDirect = function (stream, buffer) {
    stream.write(buffer);
};

/**
 * Quese the handler, creates our promise and sends the message
 * @param queue {WorkQueue}
 * @param stream {Stream}
 * @param buffer {Buffer} Ready packet, will be sent as is
 * @returns {Promise}
 */
ResponseHandler.prototype.sendMessage = function (queue, stream, buffer) {
    var self = this;

    return new Promise(function (resolve, fail) {
        self._resolve = resolve;
        self._fail = fail;

        queue.push(function (message, queueDone) {
            if (message.messageId === Protocol.serverGoneMessageId) {
                // TODO: This needs a way better handling approach for this, probably the Queue has to learn about this
                queueDone();
                fail(new Error("The server has gone away"));
                return;
            }
            if (!self[message.messageId]) {
                queueDone();
                fail(new Error("Unexpected message " + message.messageId));
                return;
            }
            try {
                self[message.messageId](message.decoded, queueDone);
            } catch (err) {
                fail(err);
            }
        });
        self.sendDirect(stream, buffer);
    });
};

/**
 * Common handler for errors.
 *
 * If a handler wants to handle these differently they can do by overriding
 *
 * @param message
 */
ResponseHandler.prototype[Messages.ServerMessages.ERROR] = function (message) {
    this._fail(new Error(message.msg));
};

/**
 * common handler invoked when the connection terminates.
 *
 * If a Handler wants to react it can override, while there is no guarantee this will be called for all queued handlers
 */
ResponseHandler.prototype.close = function () {
    this._fail(new Error("Server has gone away"));
};

