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

const Messages = require('./Messages'),
    Encoding = require('./Encoding'),
    Datatype = require('./Datatype'),
    protobuf = new (require('./protobuf.js'))(Messages);

function ResultSet(commandCallback) {
    this._cb = commandCallback;
    this._currentFinalized = true;
}

module.exports.ResultSet = ResultSet;

ResultSet.prototype.beginResult = function (columns) {
    if (!this._currentFinalized) {
        this.finalizeSingle();
    }
    if (typeof columns === 'number') {
        columns = new Array(columns);
        columns.fill({
            type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
            name: "column",
            original_name: "original_column",
            table: "table",
            original_table: "original_table",
            schema: "schema"
        });
    }
    columns.forEach(col => this._cb(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, col, Encoding.serverMessages)));
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

ResultSet.prototype.notice = function (notice) {
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.NOTICE, notice, Encoding.serverMessages));
};

ResultSet.prototype.sessionState = function (param, value) {
    value = Datatype.encodeScalar(value);
    const payload = protobuf.encode("Mysqlx.Notice.SessionStateChanged", { param: param, value: value}, 0, 0);
    this.notice({
        type: 3,
        scope: 2,
        payload: payload
    });
};

ResultSet.prototype.warning = function (warning) {
    this.notice({
        type: 1,
        scope: 2,
        payload: protobuf.encode('Mysqlx.Notice.Warning', warning)
    });
};

ResultSet.prototype.finalize = function () {
    this.finalizeSingle();
    this._cb(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
};
