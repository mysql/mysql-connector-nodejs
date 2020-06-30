/*
 * Copyright (c) 2018, 2020, Oracle and/or its affiliates.
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

/**
 * Resultset protobuf adapter.
 * @private
 * @module Resultset
 */

const ColumnMetaDataStub = require('../Stubs/mysqlx_resultset_pb').ColumnMetaData;
const FetchDone = require('../Stubs/mysqlx_resultset_pb').FetchDone;
const FetchDoneMoreOutParams = require('../Stubs/mysqlx_resultset_pb').FetchDoneMoreOutParams;
const FetchDoneMoreResultsets = require('../Stubs/mysqlx_resultset_pb').FetchDoneMoreResultsets;
const RowStub = require('../Stubs/mysqlx_resultset_pb').Row;
const columnMetadata = require('../../Types/ColumnMetadata');
const row = require('../../Types/Row');
const tools = require('../../../Protocol/Util');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Decode a Mysqlx.Resultset.ColumnMetaData protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} An object containing column metadata properties.
 */
exports.decodeColumnMetaData = function (data) {
    const proto = ColumnMetaDataStub.deserializeBinary(tools.createTypedArrayFromBuffer(data));

    debug('Mysqlx.Resultset.ColumnMetaData', JSON.stringify(proto.toObject(), null, 2));

    return columnMetadata(proto);
};

/**
 * Decode a Mysqlx.Resultset.FetchDone protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDone = function (data) {
    const proto = FetchDone.deserializeBinary(tools.createTypedArrayFromBuffer(data));

    debug('Mysqlx.Resultset.FetchDone', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.FetchDoneMoreOutParams protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDoneMoreOutParams = function (data) {
    const proto = FetchDoneMoreOutParams.deserializeBinary(tools.createTypedArrayFromBuffer(data));

    debug('Mysqlx.Resultset.FetchDoneMoreOutParams', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.FetchDoneMoreResultsets protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @returns {Object} A plain JavaScript object representation.
 */
exports.decodeFetchDoneMoreResultsets = function (data) {
    const proto = FetchDoneMoreResultsets.deserializeBinary(tools.createTypedArrayFromBuffer(data));

    debug('Mysqlx.Resultset.FetchDoneMoreResultsets', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Decode a Mysqlx.Resultset.Row protobuf.
 * @param {Buffer} data - Node.js buffer from the network
 * @param {Object} [options] - object containing the column metadata
 * @returns {object[]} An array of plain JavaScript object representation of each column.
 */
exports.decodeRow = function (data, options) {
    options = Object.assign({ metadata: [] }, options);

    const proto = RowStub.deserializeBinary(tools.createTypedArrayFromBuffer(data));

    debug('Mysqlx.Resultset.Row', JSON.stringify(proto.toObject(), null, 2));

    return row(proto).setColumnMetadata(options.metadata);
};
