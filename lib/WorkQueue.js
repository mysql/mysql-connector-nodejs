/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
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
 * @private
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
    if (!this._queue.length) {
        throw new Error("Queue is empty");
    }
    this._queue[0](message, () => {
        this._queue.shift();
    });
};
