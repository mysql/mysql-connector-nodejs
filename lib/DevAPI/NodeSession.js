/*
 * Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

var BaseSession = require('./BaseSession');
var util = require('util');

/**
 * Session to an individual server
 *
 * @param {Properties} properties
 * @extends {BaseSession}
 * @constructor
 */
function NodeSession(properties) {
    BaseSession.call(this, properties);
}

module.exports = NodeSession;

util.inherits(NodeSession, BaseSession);

/**
 * Row Callback
 * @callback SQLExecutor~RowCallback
 * @param {array} row
 */

/**
 * Meta Data from SQL
 * @typedef {Object} SQLExecutor~Meta
 * @property {Number} type Type of the field
 * @property {String} name Name of the field
 * @property {String} original_name Original name of the field (i.e. if aliased)
 * @property {String} table Name of the table
 * @property {String} original_table Original name of the table (i.e. if aliased)
 * @property {String} schema Name of the schema of the table
 * @property {String} catalog Currently always 'def'
 * @property {Number} collation
 * @property {Number} fractional_digits Number of fractional digits
 * @proeprty {Number} length Length of the field
 */

/**
 * Meta Callback
 * @callback SQLExecutor~MetaCallback
 * @param {SQLExecutor~Meta} meta data
 */

/**
 * Object holding row and meta data callbacks
 * @typedef {Object} SQLExecutor~RowMetaCallbackObject
 * @property {SQLExecutor~MetaCallback} meta callback for meta data, called for each result set
 * @property {SQLExecutor~RowCallback} row callback called for each row
 */

/**
 * @constructor
 */
function SQLExecutor() {
    // For documentation
}

/**
 * Execute SQL from {@link NodeSession#executeSql}
 * @param {(SQLExecutor~RowMetaCallbackObject|SQLExecutor~RowCallback)} [callback] Either a callback called on each row or an object containing meta and row callbacks
 * @param {SQLExecutor~MetaCallback} [metacb] A callback called on meta data
 * @returns {Promise.<Notices>}
 */
SQLExecutor.prototype.execute = function (callback, metacb) {
    // For documentation, see executeSql below
};

/**
 * Execute SQL query
 *
 * Note: This doesn't follow the DevAPI but adds an extra execute() function to define callbacks for rows and meta data
 * before each result set the meta cb is called, then for each row the rowcb. One can either provide callbacks or an
 * object containing a row and meta method
 *
 * <pre>session.executeSql("SELECT * FROM t")
 *     .execute(function (row) { process single row  })
 *     .then( function (notices) { process notices });</pre>
 *
 * or
 *
 * <pre>session.executeSql("SELECT * FROM t")
 *     .execute({
 *         row: function (row) { process single row },
 *         meta: function (meta) { process meta data }
 *      })
 *     .then( function (notices) { process notices });</pre>
 *
 * @param {string} sql SQL string
 * @returns {SQLExecutor}
 */
NodeSession.prototype.executeSql = function (sql) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return {
        execute: function (rowcb, metacb) {
            if (rowcb && typeof rowcb !== 'function') {
                metacb = rowcb.meta;
                rowcb = rowcb.row;
            }
            return self._client.sqlStmtExecute(sql, args, rowcb, metacb);
        }
    };
};
