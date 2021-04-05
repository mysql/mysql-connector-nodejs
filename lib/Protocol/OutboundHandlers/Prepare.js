/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
 * Mysqlx.Prepare outbound message handlers.
 * @private
 * @module handlers.Mysqlx.Prepare
 */

const deallocate = require('../Wrappers/Messages/Prepare/Deallocate');
const execute = require('../Wrappers/Messages/Prepare/Execute');
const logger = require('../../logger');
const prepare = require('../Wrappers/Messages/Prepare/Prepare');

const log = logger('protocol:outbound:Mysqlx.Prepare');

/**
 * Encode a Mysqlx.Prepare.Prepare protobuf message.
 * @function
 * @name module:Prepare#encodePrepare
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodePrepare = function (query) {
    const outboundPrepare = prepare.create(query);
    log.info('Prepare', outboundPrepare);

    return outboundPrepare.serialize();
};

/**
 * Encode a Mysqlx.Prepare.Execute protobuf message.
 * @function
 * @name module:Prepare#encodeExecute
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeExecute = function (query) {
    const outboundExecute = execute.create(query);
    log.info('Execute', outboundExecute);

    return outboundExecute.serialize();
};

/**
 * Encode a Mysqlx.Prepare.Deallocate protobuf message.
 * @function
 * @name module:Prepare#encodeDeallocate
 * @param {Query} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeDeallocate = function (query) {
    const outboundDeallocate = deallocate.create(query);
    log.info('Deallocate', outboundDeallocate);

    return outboundDeallocate.serialize();
};
