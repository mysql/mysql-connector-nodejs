/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

'use strict';

const Column = require('./Column');
const Result = require('./Result');

/**
 * Build a raw query wrapper.
 * @constructor
 */
function Statement (client, query, args) {
    this._client = client;
    this._query = query;
    this._args = args || [];
}

module.exports = Statement;

/**
 * Execute a raw SQL query.
 * @param {Function|Object} rowcb - Callback function to handle results, or an object with both callback functions.
 * @param {Function} [metacb] - Callback function to handle metadata.
 * @example
 * // provide only a callback to handle results
 * query.execute(result => {})
 * query.execute({ result () {} })
 *
 * // provide only a callback to handle metadata
 * query.execute({ meta () {} })
 *
 * // provide callbacks to handle results and metadata
 * query.execute(result => {}, meta => {})
 * query.execute({ result () {}, meta () {} })
 * @returns {Promise}
 */
Statement.prototype.execute = function (rowcb, metacb) {
    if (typeof rowcb === 'object') {
        // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
        metacb = rowcb.meta;
        rowcb = rowcb.row;
    }

    return this._client
        .sqlStmtExecute(this._query, this._args, rowcb, Column.metaCB(metacb))
        .then(state => new Result(state));
};
