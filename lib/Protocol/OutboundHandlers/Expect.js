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
 * Mysqlx.Expect outbound message handlers.
 * @private
 * @module handlers.Mysqlx.Expect
 */

const close = require('../Wrappers/Messages/Expect/Close');
const logger = require('../../logger');
const open = require('../Wrappers/Messages/Expect/Open');

const log = logger('protocol:outbound:Mysqlx.Expect');

/**
 * Expectation definition.
 * @private
 * @typedef {Object} Expectation
 * @prop {number} key - basic expectation (EXPECT_NO_ERROR|EXPECT_FIELD_EXIST|EXPECT_DOCID_GENERATED)
 * @prop {string} [value] - condition identifier
 * @prop {number} [operation] - set or unset an expectation
 */

/**
 * Encode a Mysqlx.Expect.Close protobuf message.
 * @function
 * @name module:Expect#encodeClose
 * @returns {Buffer} The buffer-encoded protobuf object.
 */
exports.encodeClose = function () {
    const outboundClose = close.create();
    log.info('Close', outboundClose);

    return outboundClose.serialize();
};

/**
 * Encode a Mysqlx.Expect.Open protobuf message.
 * @function
 * @name module:Expect#encodeOpen
 * @param {Expectation[]} expectations - list of expectations
 * @returns {Buffer} The buffer-encoded protobuf object.
 */
exports.encodeOpen = function (expectations) {
    const outboundOpen = open.create(expectations);
    log.info('Open', outboundOpen);

    return outboundOpen.serialize();
};
