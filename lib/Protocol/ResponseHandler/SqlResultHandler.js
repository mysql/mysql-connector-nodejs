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

"use strict";

const util = require('util'),
    Messages = require('../Messages'),
    Encoding = require('../Encoding'),
    Datatype = require('../Datatype'),
    ResponseHandler = require('./ResponseHandler.js');

/**
 *
 * @param rowcb Callback invoked for each row with an array of fields as single argument
 * @param metacb Optional callback involved when meta data received
 * @constructor
 */
function SqlResultHandler(rowcb, metacb) {
    ResponseHandler.call(this);

    if (rowcb && typeof rowcb !== "function") {
        throw new TypeError("row callback has to be a function");
    }
    if (metacb && typeof metacb !== "function") {
        throw new TypeError("row callback has to be a function");
    }

    this._meta = [];
    this._metacb = metacb;
    this._metacbInvoked = true;
    this._rowcb = rowcb;
    this._rowcbCallCount = 0;

    this._warnings = [];
    this._generated_insert_id = undefined;
    this._rows_affected = undefined;
    this._messages = [];

    this._unhandled_notices = [];
}

module.exports = SqlResultHandler;

util.inherits(SqlResultHandler, ResponseHandler);

SqlResultHandler.prototype.invokeMetacb = function () {
    if (!this._metacbInvoked && this._metacb) {
        const meta = this._meta.map(field => {
            var m = {};
            for (let k in field) {
                m[k] = (typeof field[k] === 'object') ? field[k].toString() : field[k];
            }
            return m;
        });
        this._metacb(meta);
        this._metacbInvoked = true;
    }
};

SqlResultHandler.prototype.clearMeta = function () {
    this._meta = [];
};

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_COLUMN_META_DATA] = function (message, queueDone) {
    this._meta.push(message);
    this._metacbInvoked = false;
};

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_ROW] = function (message, queueDone) {
    this.invokeMetacb();

    if (this._rowcb) {
        const row = message.field.map((column, id) => Datatype.decodeField(column, this._meta[id]) );
        this._rowcbCallCount += 1;
        this._rowcb(row);
    }
};

SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_FETCH_DONE] = function (message, queueDone) {
    this.invokeMetacb();
    this.clearMeta();

    if (this._rowcb && this._rowcbCallCount === 0) {
        this._rowcb([]);
    }
};

SqlResultHandler.prototype[Messages.ServerMessages.SQL_STMT_EXECUTE_OK] = function (message, queueDone) {
    queueDone();
    let result = {};
    if (this._rows_affected) {
        result.rows_affected = this._rows_affected;
    }
    if (this._generated_insert_id) {
        result.generated_insert_id = this._generated_insert_id;
    }
    if (this._warnings.length) {
        result.warnings = this._warnings;
    }
    if (this._messages.length) {
        result.message = this._messages;
    }
    this._resolve(result);
};


SqlResultHandler.prototype[Messages.ServerMessages.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = function (message, queueDone) {
    this.invokeMetacb();
    this.clearMeta();
};

SqlResultHandler.prototype[Messages.ServerMessages.NOTICE] = function (message) {
    var notice = Encoding.decodeNotice(message);
    if (notice.type === 1) {
        this._warnings.push(notice.notice);
    } else if (notice.type === 3 && notice.notice.param === 3) {
        this._generated_insert_id = notice.notice.value.toString() * 1;
    } else if (notice.type === 3 && notice.notice.param === 4) {
        this._rows_affected = notice.notice.value.toString() * 1;
    } else if (notice.type === 3 && notice.notice.param === 10) {
        this._messages.push(notice.notice.value);
    } else {
        //console.log("UNEXPECTED Notice in SqlResultHandler");
        //console.log(notice);
        this._unhandled_notices.push(notice);
    }
};
