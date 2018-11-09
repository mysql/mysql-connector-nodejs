/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
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

const BaseHandler = require('./BaseHandler');
const Frame = require('../Protobuf/Stubs/mysqlx_notice_pb').Frame;
const Notice = require('../Protobuf/Adapters/Notice');
const Resultset = require('../Protobuf/Adapters/Resultset');
const ServerMessages = require('../Protobuf/Stubs/mysqlx_pb').ServerMessages;
const SessionStateChanged = require('../Protobuf/Stubs/mysqlx_notice_pb').SessionStateChanged;
const util = require('util');

/**
 * @private
 * @param rowcb Callback invoked for each row with an array of fields as single argument
 * @param metacb Optional callback involved when meta data received
 * @constructor
 */
function SqlResultHandler (rowcb, metacb) {
    BaseHandler.call(this);

    if (rowcb && typeof rowcb !== 'function') {
        throw new TypeError('row callback has to be a function');
    }
    if (metacb && typeof metacb !== 'function') {
        throw new TypeError('row callback has to be a function');
    }

    this._meta = [];
    this._metadata = [];
    this._metacb = metacb;
    this._metacbInvoked = true;
    this._rowcb = rowcb;
    this._rowcbCallCount = 0;

    this._resultIndex = 0;

    this._warnings = [];
    this._generated_insert_id = undefined;
    this._rows_affected = 0;
    this._generated_document_ids = [];
    this._messages = [];
    this._results = [];

    this._unhandled_notices = [];
}

module.exports = SqlResultHandler;

util.inherits(SqlResultHandler, BaseHandler);

SqlResultHandler.prototype.invokeMetacb = function () {
    const meta = this._meta.map(field => {
        var m = {};
        for (let k in field) {
            m[k] = (typeof field[k] === 'object') ? field[k].toString() : field[k];
        }
        return m;
    });

    if (!this._metacb || this._metacbInvoked) {
        this._meta = meta;
        return;
    }

    this._metacb(meta);
    this._metacbInvoked = true;
};

SqlResultHandler.prototype.clearMeta = function () {
    this._meta = [];
};

SqlResultHandler.prototype[ServerMessages.Type.RESULTSET_COLUMN_META_DATA] = function (payload, queueDone) {
    const metadata = Resultset.decodeColumnMetaData(payload);

    this._meta.push(metadata);

    this._metacbInvoked = false;
};

SqlResultHandler.prototype[ServerMessages.Type.RESULTSET_ROW] = function (payload, queueDone) {
    this.invokeMetacb();

    const row = Resultset.decodeRow(payload, { metadata: this._meta });

    if (!this._rowcb) {
        this._results[this._resultIndex] = this._results[this._resultIndex] || [];
        this._results[this._resultIndex].push(row);
        return;
    }

    this._rowcbCallCount += 1;
    this._rowcb(row);
};

SqlResultHandler.prototype[ServerMessages.Type.RESULTSET_FETCH_DONE] = function () {
    this._metadata.push(this._meta);

    this.invokeMetacb();

    if (!this._rowcbCallCount !== 0) {
        return;
    }

    this._rowcb([]);
};

SqlResultHandler.prototype[ServerMessages.Type.SQL_STMT_EXECUTE_OK] = function (payload, queueDone) {
    this._resultIndex = 0;

    queueDone();

    this._resolve({
        results: this._results,
        generatedDocumentIds: this._generated_document_ids,
        generatedInsertId: this._generated_insert_id,
        messages: this._messages,
        metadata: this._metadata,
        rowsAffected: this._rows_affected,
        warnings: this._warnings
    });

    this.clearMeta();
};

SqlResultHandler.prototype[ServerMessages.Type.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = function () {
    this._resultIndex += 1;

    this._metadata.push(this._meta);

    this.invokeMetacb();
    this.clearMeta();
};

SqlResultHandler.prototype[ServerMessages.Type.NOTICE] = function (payload) {
    const frame = Notice.decodeFrame(payload);

    switch (frame.type) {
    case Frame.Type.WARNING:
        return this._warnings.push(frame.warning);
    case Frame.Type.SESSION_STATE_CHANGED:
        switch (frame.state.type) {
        case SessionStateChanged.Parameter.GENERATED_DOCUMENT_IDS:
            this._generated_document_ids = this._generated_document_ids.concat(frame.state.values);
            return;
        case SessionStateChanged.Parameter.GENERATED_INSERT_ID:
            this._generated_insert_id = frame.state.values[0];
            return;
        case SessionStateChanged.Parameter.ROWS_AFFECTED:
            this._rows_affected = frame.state.values[0];
            return;
        case SessionStateChanged.Parameter.PRODUCED_MESSAGE:
            this._messages = this._messages.concat(frame.state.values);
            return;
        default:
            break;
        }
        break;
    default:
        return this._unhandled_notices.push(frame.variable);
    };
};
