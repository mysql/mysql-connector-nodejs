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

/**
 * Create a WorkQueue
 * @constructor
 * @private
 */
function WorkQueue () {
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
    if (!this._queue.length) {
        throw new Error('Queue is empty');
    }

    this._queue[0](message, () => this._queue.shift());
};
