/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
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
 * Prepare protobuf encoding adapter.
 * @private
 * @module Prepare
 */

const Crud = require('./Crud');
const Deallocate = require('../Stubs/mysqlx_prepare_pb').Deallocate;
const Execute = require('../Stubs/mysqlx_prepare_pb').Execute;
const Prepare = require('../Stubs/mysqlx_prepare_pb').Prepare;
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Create a Mysqlx.Prepare.OneOfMessage protobuf type.
 * @function
 * @name module:Prepare#createOneOfMessage
 * @param {Query} query - database operation instance
 * @returns {proto.Mysqlx.Prepare.OneOfMessage}
 */
exports.createOneOfMessage = function (query, options) {
    const type = query.getType();
    const proto = new Prepare.OneOfMessage();
    proto.setType(type);

    switch (type) {
    case Prepare.OneOfMessage.Type.FIND:
        proto.setFind(Crud.createFind(query, options));
        break;
    case Prepare.OneOfMessage.Type.UPDATE:
        proto.setUpdate(Crud.createUpdate(query, options));
        break;
    case Prepare.OneOfMessage.Type.DELETE:
        proto.setDelete(Crud.createDelete(query, options));
        break;
    default:
        // throw error
    }

    return proto;
};

/**
 * Encode a Mysqlx.Prepare.Prepare protobuf message.
 * @function
 * @name module:Prepare#encodePrepare
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodePrepare = function (query, options) {
    const useLimitExpr = typeof query.getCount !== 'undefined' && typeof query.getCount() !== 'undefined';

    options = Object.assign({ cacheExpression: true, appendArgs: false, useLimitExpr }, options);

    const proto = new Prepare();
    proto.setStmtId(query.getStatementId());
    proto.setStmt(this.createOneOfMessage(query, options));

    debug('Mysqlx.Prepare.Prepare', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Prepare.Execute protobuf message.
 * @function
 * @name module:Prepare#encodeExecute
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeExecute = function (query) {
    const proto = new Execute();
    proto.setStmtId(query.getStatementId());
    proto.setArgsList(Crud.createPreparedStatementArgs(query));

    debug('Mysqlx.Prepare.Execute', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Prepare.Deallocate protobuf message.
 * @function
 * @name module:Prepare#encodeDeallocate
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeDeallocate = function (query) {
    const proto = new Deallocate();
    proto.setStmtId(query.getStatementId());

    debug('Mysqlx.Prepare.Deallocate', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};
