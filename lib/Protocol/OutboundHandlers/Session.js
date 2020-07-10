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
 * Mysqlx.Session outbound message handlers.
 * @private
 * @module handlers.Mysqlx.Session
 */

const authenticateContinue = require('../Wrappers/Messages/Session/AuthenticateContinue');
const authenticateStart = require('../Wrappers/Messages/Session/AuthenticateStart');
const close = require('../Wrappers/Messages/Session/Close');
const logger = require('../../tool/log');
const reset = require('../Wrappers/Messages/Session/Reset');

const log = logger('protocol:outbound:Mysqlx.Session');

/**
 * Encode a Mysqlx.Session.AuthenticateStart protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateStart
 * @param {string} mechanism - name of the authentication mechanism
 * @param {Buffer} [token] - authentication token
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateStart = function (mechanism, token) {
    const outboundAuthenticateStart = authenticateStart.create(mechanism, token);
    log.info('AuthenticateStart', outboundAuthenticateStart);

    return outboundAuthenticateStart.serialize();
};

/**
 * Encode a Mysqlx.Session.AuthenticateContinue protobuf message.
 * @function
 * @name module:Session#encodeAuthenticateContinue
 * @param {Buffer} token - raw authentication data
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeAuthenticateContinue = function (token) {
    const outboundAuthenticateContinue = authenticateContinue.create(token);
    log.info('AuthenticateContinue', outboundAuthenticateContinue);

    return outboundAuthenticateContinue.serialize();
};

/**
 * Encode a Mysqlx.Session.Close protobuf message.
 * @function
 * @name module:Session#encodeClose
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeClose = function () {
    const outboundClose = close.create();
    log.info('Close', outboundClose);

    return outboundClose.serialize();
};

/**
 * Encode a Mysqlx.Session.Reset protobuf message.
 * @function
 * @name module:Session#encodeReset
 * @param {Object} [options] - reset options
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeReset = function (options) {
    options = Object.assign({ keepOpen: true }, options);

    const outboundReset = reset.create(options.keepOpen);
    log.info('Reset', outboundReset);

    return outboundReset.serialize();
};
