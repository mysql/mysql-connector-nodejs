/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const NoticeStub = require('../Stubs/mysqlx_notice_pb');
const columnMetadata = require('../Wrappers/Messages/Resultset/ColumnMetadata');
const fetchDone = require('../Wrappers/Messages/Resultset/FetchDone');
const fetchDoneMoreResultsets = require('../Wrappers/Messages/Resultset/FetchDoneMoreResultsets');
const logger = require('../../logger');
const notice = require('../Wrappers/Messages/Notice/Frame');
const row = require('../Wrappers/Messages/Resultset/Row');
const stmtExecuteOk = require('../Wrappers/Messages/Sql/StmtExecuteOk');
const util = require('util');

const log = logger('protocol:inbound:Mysqlx');

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
    this._metadataHandlerCalled = false;

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

SqlResultHandler.prototype[columnMetadata.MESSAGE_ID] = function (payload) {
    // The row metadata contains the metadata of each column that is part of
    // the result set.
    const inboundColumnMetadata = columnMetadata.deserialize(payload);
    log.info('Resultset.ColumnMetaData', inboundColumnMetadata);

    // There is more metadata available (probably a new result set) so we need
    // to ensure the handler is called again.
    this._metadataHandlerCalled = false;

    // And save it until the result set is entirely processed.
    this._currentResultsetMetadata.push(inboundColumnMetadata);
};

SqlResultHandler.prototype[row.MESSAGE_ID] = function (payload) {
    const metadata = this._currentResultsetMetadata;

    const inboundRow = row.deserialize(payload).setColumnMetadata(metadata);
    log.info('Resultset.Row', inboundRow);

    // If there are no handlers to call, it means the data should be buffered
    // (but not decoded).
    if (typeof this._metadataHandler !== 'function' && typeof this._dataHandler !== 'function') {
        this._results[this._resultIndex] = this._results[this._resultIndex] || [];
        this._results[this._resultIndex].push(inboundRow);

        return;
    }

    // Otherwise, any handler that is OPTIONALLY provided should be called and
    // the data properly decoded. Metadata should still be decoded on-demand.
    // However, column metadata only changes when there is a new result set,
    // which means the handler should only be called once for each result set.
    if (typeof this._metadataHandler === 'function' && !this._metadataHandlerCalled) {
        this._metadataHandler(metadata);
        // The metadata for each column of any existing row in the current
        // result set should have been processed by this point, so, we need to
        // signal it in order to avoid additional calls to the handler.
        this._metadataHandlerCalled = true;
    }

    // The data handler should always be a function by this point.
    this._dataHandler(inboundRow);
};

SqlResultHandler.prototype[fetchDone.MESSAGE_ID] = function (payload) {
    log.info('Resultset.FetchDone', fetchDone.deserialize(payload));

    // although this is the case where there's only one result set, we should build the final list containting it
    this._metadataForAllResultsets.push(this._currentResultsetMetadata);
    // free up some memory by resetting the unreferenced result set metadata
    this._currentResultsetMetadata = [];
};

SqlResultHandler.prototype[stmtExecuteOk.MESSAGE_ID] = function (payload, queueDone) {
    log.info('Sql.StmtExecuteOk', stmtExecuteOk.deserialize(payload));

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

SqlResultHandler.prototype[fetchDoneMoreResultsets.MESSAGE_ID] = function (payload) {
    log.info('Resultset.FetchDoneMoreResultsets', fetchDoneMoreResultsets.deserialize(payload));

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

SqlResultHandler.prototype[notice.MESSAGE_ID] = function (payload) {
    const inboundNotice = notice.deserialize(payload);
    log.info('Notice.Frame', inboundNotice);

    const frame = inboundNotice.toObject();

    switch (frame.type) {
    case NoticeStub.Frame.Type.WARNING:
        return this._warnings.push(frame.warning);
    case NoticeStub.Frame.Type.SESSION_STATE_CHANGED:
        switch (frame.state.type) {
        case NoticeStub.SessionStateChanged.Parameter.GENERATED_DOCUMENT_IDS:
            // document ids are encoded as V_OCTETS but they should only be decoded on demand
            // see module:Result#getGeneratedIds
            this._generated_document_ids = this._generated_document_ids.concat(frame.state.values);
            return;
        case NoticeStub.SessionStateChanged.Parameter.GENERATED_INSERT_ID:
            this._generated_insert_id = frame.state.values[0];
            return;
        case NoticeStub.SessionStateChanged.Parameter.ROWS_AFFECTED:
            this._rows_affected = frame.state.values[0];
            return;
        case NoticeStub.SessionStateChanged.Parameter.PRODUCED_MESSAGE:
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
