/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
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

'use strict';

/**
 * Sql protobuf encoding adapter.
 * @private
 * @module Sql
 */

const StmtExecute = require('../Stubs/mysqlx_sql_pb').StmtExecute;
const Datatypes = require('./Datatypes');
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Encode a Mysqlx.Sql.StmtExecute protobuf message.
 * @function
 * @name module:Sql#encodeStmtExecute
 * @param {StmtExecute} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeStmtExecute = function (query) {
    const message = new StmtExecute();
    message.setNamespace(query.getNamespace());
    /* eslint-disable node/no-deprecated-api */
    message.setStmt(new Uint8Array(new Buffer(query.getRawStatement())));
    /* eslint-enable node/no-deprecated-api */

    query.getArgs().forEach(arg => {
        message.addArgs(Datatypes.encodeAny(arg));
    });

    debug('Mysqlx.Sql.StmtExecute', JSON.stringify(message.toObject(), null, 2));

    /* eslint-disable node/no-deprecated-api */
    return new Buffer(message.serializeBinary());
    /* eslint-enable node/no-deprecated-api */
};
