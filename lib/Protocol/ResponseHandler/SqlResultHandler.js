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

var Messages = require('../Messages');
var Datatype = require('../Datatype');
var ResponseHandler = require('./ResponseHandler.js');

/**
 *
 * @param rowcb Callback invoked for each row with an array of fields as single argument
 * @param metacb Optional callback involved when meta data received
 * @constructor
 */
function SqlResultHandler(rowcb, metacb) {
    ResponseHandler.call(this);

    if (rowcb && typeof rowcb !== "function") {
        throw new Error("row callback has to be a function");
    }
    if (metacb && typeof metacb !== "function") {
        throw new Error("row callback has to be a function");
    }

    this._meta = [];
    this._metacb = metacb;
    this._rowcb = rowcb;

    this._warnings = [];
    this._generated_insert_ids = [];
    this._rows_affected = [];
}

module.exports = SqlResultHandler;

SqlResultHandler.prototype = Object.create(ResponseHandler.prototype);

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_COLUMN_META_DATA] = function (message, queueDone) {
    this._meta.push(message);
    if (this._metacb) {
        this._metacb(message);
    }
    return;
};

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_ROW] = function (message, queueDone) {
    var row = [];

    if (this._rowcb) {
        const row = message.field.map((column, id) => Datatype.decodeField(column, this._meta[id]) );
        this._rowcb(row);
    }
};

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_FETCH_DONE] = function (message, queueDone) {
};

SqlResultHandler.prototype[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = function (message, queueDone) {
    queueDone();
    let result = {};
    if (this._rows_affected.length) {
        result.rows_affected = this._rows_affected;
    }
    if (this._generated_insert_ids.length) {
        result.generated_insert_ids = this._generated_insert_ids;
    }
    if (this._warnings.length) {
        result.warnings = this._warnings;
    }
    this._resolve(result);
};


SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = function (message, queueDone) {
};

SqlResultHandler.prototype[Messages.ServerMessages.NOTICE] = function (message) {
    var Client = require('../Client');
    var notice = Client.decodeNotice(message);
    if (notice.type === 1) {
        this._warnings.push(notice.notice);
    } else if (notice.type === 3 && notice.notice.param === 3) {
        this._generated_insert_ids.push(notice.notice.value);
    } else if (notice.type === 3 && notice.notice.param === 4) {
        this._rows_affected.push(notice.notice.value);
    } else {
        console.log("UNEXPECTED Notice in SqlResultHandler");
        console.log(notice);
    }
};
