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

const BaseHandler = require('./BaseHandler');
const authenticateContinue = require('../Wrappers/Messages/Session/AuthenticateContinue');
const authenticateOk = require('../Wrappers/Messages/Session/AuthenticateOk');
const notice = require('../Wrappers/Messages/Notice/Frame');
const logger = require('../../logger');
const sessionStateChanged = require('../Wrappers/Messages/Notice/SessionStateChanged');
const util = require('util');

const log = logger('protocol:inbound:Mysqlx');

function AuthenticationHandler (auth, protocol) {
    BaseHandler.call(this);
    this._auth = auth;
    this._client = protocol;
}

util.inherits(AuthenticationHandler, BaseHandler);

AuthenticationHandler.prototype[notice.MESSAGE_ID] = function (payload) {
    const inboundNotice = notice.deserialize(payload);
    log.info('Notice.Frame', inboundNotice);

    if (inboundNotice.getTypeId() !== notice.Type.SESSION_STATE_CHANGED) {
        return;
    }

    const inboundSessionStateChanged = inboundNotice.getPayload();

    if (inboundSessionStateChanged.getParameterId() !== sessionStateChanged.Parameter.CLIENT_ID_ASSIGNED) {
        return;
    }

    // otherwise, there is a connection id available
    this._connectionId = inboundSessionStateChanged.toObject().values[0];
};

AuthenticationHandler.prototype[authenticateContinue.MESSAGE_ID] = function (payload, queueDone) {
    const inboundAuthenticateContinue = authenticateContinue.deserialize(payload);
    log.info('Session.AuthenticateContinue', inboundAuthenticateContinue);

    const data = Buffer.from(inboundAuthenticateContinue.toObject().authData, 'base64');

    try {
        this._client.authenticateContinue(this._auth.getNextAuthData(data), this);
    } catch (err) {
        queueDone();
        this._fail(err);
    }
};

AuthenticationHandler.prototype[authenticateOk.MESSAGE_ID] = function (payload, queueDone) {
    queueDone();

    const inboundAuthenticateOk = authenticateOk.deserialize(payload);
    log.info('Session.AuthenticateOk', inboundAuthenticateOk);

    this._resolve({ connectionId: this._connectionId });
};

module.exports = AuthenticationHandler;
