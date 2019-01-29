/*
 * Copyright (c) 2018, 2019 Oracle and/or its affiliates. All rights reserved.
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
 * Sql protobuf encoding adapter.
 * @private
 * @module Sql
 */

const StmtExecute = require('../Stubs/mysqlx_sql_pb').StmtExecute;
const StmtExecuteOk = require('../Stubs/mysqlx_sql_pb').StmtExecuteOk;
const Datatypes = require('./Datatypes');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Build a Mysqlx.Sql.StmtExecute protobuf message.
 * @function
 * @name module:Sql#createStmtExecute
 * @param {module:SqlExecute} query - database operation instace
 * @returns {Mysqlx.Sql.StmtExecute}
 */
exports.createStmtExecute = function (query, options) {
    options = Object.assign({ appendArgs: true, useLimitExpr: false }, options);

    const proto = new StmtExecute();
    proto.setNamespace(query.getNamespace());
    // eslint-disable-next-line node/no-deprecated-api
    proto.setStmt(new Uint8Array(new Buffer(query.getSQL())));

    if (options.appendArgs) {
        proto.setArgsList(this.createOperationArgs(query));
    }

    return proto;
};

/**
 * Decode a Mysqlx.Sql.StmtExecuteOk protobuf message.
 * @function
 * @name module:Sql#decodeStmtExecuteOk
 * @param {Buffer} data - raw protobuf message
 * @returns {Object} An empty object
 */
exports.decodeStmtExecuteOk = function (data) {
    const proto = StmtExecuteOk.deserializeBinary(new Uint8Array(data));

    debug('Mysqlx.Sql.StmtExecuteOk', JSON.stringify(proto.toObject(), null, 2));

    return proto.toObject();
};

/**
 * Encode a list of Mysqlx.Sql.StmtExecute arguments as Mysqlx.Datatypes.Any values.
 * @function
 * @name module:Sql#createOperationArgs
 * @param {module:SqlExecute} query - database operation instace
 * @returns {Array.<Mysqlx.Datatypes.Any>}
 */
exports.createOperationArgs = function (query) {
    return query.getArgs().map(arg => Datatypes.createAny(arg));
};

/**
 * Encode a Mysqlx.Sql.StmtExecute protobuf message.
 * @function
 * @name module:Sql#encodeStmtExecute
 * @param {module:SqlExecute} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeStmtExecute = function (query) {
    const proto = this.createStmtExecute(query);

    debug('Mysqlx.Sql.StmtExecute', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};
