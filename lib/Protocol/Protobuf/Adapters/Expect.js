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
 * Expect protobuf encoding adapter.
 * @private
 * @module Expect
 */

const Close = require('../Stubs/mysqlx_expect_pb').Close;
const Open = require('../Stubs/mysqlx_expect_pb').Open;
const util = require('util');

const debug = util.debuglog('protobuf');

/**
 * Expectation definition.
 * @private
 * @typedef {Object} Expectation
 * @prop {number} key - basic expectation (EXPECT_NO_ERROR|EXPECT_FIELD_EXIST|EXPECT_DOCID_GENERATED)
 * @prop {string} [value] - condition identifier
 * @prop {number} [operation] - set or unset an expectation
 */

/**
 * Create a Mysqlx.Expect.Open.Condition protobuf object.
 * @function
 * @name module:Expect#createCondition
 * @param {Expectation} expectation - expectation definition
 * @returns {proto.Mysqlx.Expect.Open.Condition} The protobuf object.
 */
exports.createCondition = function (expectation) {
    const proto = new Open.Condition();
    proto.setConditionKey(expectation.key);
    // eslint-disable-next-line node/no-deprecated-api
    proto.setConditionValue(new Uint8Array(new Buffer(expectation.value)));
    proto.setOp(expectation.operation);

    return proto;
};

/**
 * Encode a Mysqlx.Expect.Close protobuf message.
 * @function
 * @name module:Expect#encodeClose
 * @returns {Buffer} The buffer-encoded protobuf object.
 */
exports.encodeClose = function () {
    const proto = new Close();

    debug('Mysqlx.Expect.Close', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

/**
 * Encode a Mysqlx.Expect.Open protobuf message.
 * @function
 * @name module:Expect#encodeOpen
 * @param {Expectation[]} expectations - list of expectations
 * @returns {Buffer} The buffer-encoded protobuf object.
 */
exports.encodeOpen = function (expectations) {
    const proto = new Open();
    proto.setCondList(expectations.map(e => this.createCondition(e)));

    debug('Mysqlx.Expect.Open', JSON.stringify(proto.toObject(), null, 2));

    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(proto.serializeBinary());
};

exports.Open = { Condition: Open.Condition };
