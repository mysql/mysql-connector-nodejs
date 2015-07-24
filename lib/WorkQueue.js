/**
 * WorkQueue - A queue handling responses as they come over the wire
 *
 * This holds a queue of handlers for incoming operations. The front handler
 * will process response till it considers itself done and notifies this
 * queue. On a multiplexing connection each session requires it's queue
 *
 * The handler method will receive two arguments. Argument 1 being the message,
 * argument 2 the callback for signaling that the handler is done (i.e. after
 * receiving the end of a result set)
 */
"use strict";


/**
 * Create a WorkQueue
 * @constructor
 */
function WorkQueue() {
    // Currently we use a simple array with push and shift as queue implementation this should be efficient enough as we
    // don't expect a long queue. This assumption might be wrong with bulk operations.
    this._queue = [];
}

module.exports = WorkQueue;


WorkQueue.prototype.push = function (handler) {
    this._queue.push(handler);
};

WorkQueue.prototype.clear = function () {
    this._queue = [];
};

WorkQueue.prototype.hasMore = function () {
    return !!this._queue.length;
};

WorkQueue.prototype.process = function (message) {
    var self = this;
    if (!this._queue.length) {
        throw new Error("Queue is empty");
    }
    this._queue[0](message, function () {
        self._queue.shift();
    });
};
