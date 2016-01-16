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

const Messages = require('./Messages'),
    Encoding = require('./Encoding'),
    protobuf = new (require('./protobuf.js'))(Messages);

function ResultSet(commandCallback) {
    this._cb = commandCallback;
    this._currentFinalized = true;
}

module.exports.ResultSet = ResultSet;

ResultSet.prototype.beginResult = function (columnCount) {
    if (!this._currentFinalized) {
        this.finalizeSingle();
    }
    for (let i = 0; i < columnCount; ++i) {
        this._cb(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
            type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
            name: "column" + i,
            original_name: "original_column" + i,
            table: "table",
            original_table: "original_table",
            schema: "schema"
        }, Encoding.serverMessages));
    }
    this._currentFinalized = false;
};

ResultSet.prototype.row = function (columns) {
    if (typeof columns === 'number') {
        let fields = [];
        for (let c = 0; c < columns; ++c) {
            fields.push("\x01");
        }
        columns = fields;
    }
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: columns }, Encoding.serverMessages));
};

ResultSet.prototype.finalizeSingle = function () {
    if (this._currentFinalized) {
        return;
    }
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
    this._currentFinalized = true;
};

ResultSet.prototype.warning = function (warning) {
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.NOTICE, {
        type: 1,
        scope: 2,
        payload: protobuf.encode('Mysqlx.Notice.Warning', warning)
    }, Encoding.serverMessages));
};

ResultSet.prototype.finalize = function () {
    this.finalizeSingle();
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
}
