/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates.
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
const Mysqlx = require('../Protobuf/Adapters/Mysqlx');
const Notice = require('../Protobuf/Adapters/Notice');
const Resultset = require('../Protobuf/Adapters/Resultset');
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

    this._currentResultsetMetadata = [];
    this._metadataForAllResultsets = [];

    this._metadataHandler = metacb;
    this._dataHandler = rowcb;

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

SqlResultHandler.prototype[Mysqlx.ServerMessages.RESULTSET_COLUMN_META_DATA] = function (payload) {
    // the row metadata contains the metadata of each column that is part of the result set
    this._currentResultsetMetadata.push(Resultset.decodeColumnMetaData(payload));
};

SqlResultHandler.prototype[Mysqlx.ServerMessages.RESULTSET_ROW] = function (payload) {
    const metadata = this._currentResultsetMetadata;
    const row = Resultset.decodeRow(payload, { metadata });

    // if there are no handlers to call, it means the data should be buffered (but not decoded)
    if (typeof this._metadataHandler !== 'function' && typeof this._dataHandler !== 'function') {
        this._results[this._resultIndex] = this._results[this._resultIndex] || [];
        this._results[this._resultIndex].push(row);

        return;
    }

    // otherwise, any handler that is provided should be called and the data properly decoded
    // metadata should still be decoded on-demand
    typeof this._metadataHandler === 'function' && this._metadataHandler(metadata);
    typeof this._dataHandler === 'function' && this._dataHandler(row.decode());
};

SqlResultHandler.prototype[Mysqlx.ServerMessages.RESULTSET_FETCH_DONE] = function () {
    // although this is the case where there's only one result set, we should build the final list containting it
    this._metadataForAllResultsets.push(this._currentResultsetMetadata);
    // free up some memory by resetting the unreferenced result set metadata
    this._currentResultsetMetadata = [];
};

SqlResultHandler.prototype[Mysqlx.ServerMessages.SQL_STMT_EXECUTE_OK] = function (_, queueDone) {
    // the entire result set has been consumed, so we need to reset the internal
    this._resultIndex = 0;

    // we're done with processing the current job in the queue
    queueDone();

    this._resolve({
        results: this._results,
        generatedDocumentIds: this._generated_document_ids,
        generatedInsertId: this._generated_insert_id,
        messages: this._messages,
        metadata: this._metadataForAllResultsets,
        rowsAffected: this._rows_affected,
        warnings: this._warnings
    });
};

SqlResultHandler.prototype[Mysqlx.ServerMessages.RESULTSET_FETCH_DONE_MORE_RESULTSETS] = function () {
    // append the current result set metadata to the list containting the metadata of all result sets
    this._metadataForAllResultsets.push(this._currentResultsetMetadata);
    // free up some memory by resetting the unreferenced result set metadata
    this._currentResultsetMetadata = [];

    // make sure the current result set is properly initialized in case it comes empty from the server
    if (!this._results[this._resultIndex]) {
        this._results[this._resultIndex] = [];
    }

    // there are more result sets to consume, so we need to increment the global result set iterator
    this._resultIndex += 1;
};

SqlResultHandler.prototype[Mysqlx.ServerMessages.NOTICE] = function (payload) {
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
