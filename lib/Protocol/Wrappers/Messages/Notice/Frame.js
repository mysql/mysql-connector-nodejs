/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const FrameStub = require('../../../Stubs/mysqlx_notice_pb').Frame;
const ServerMessagesStub = require('../../../Stubs/mysqlx_pb').ServerMessages;
const bytes = require('../../../Wrappers/ScalarValues/bytes');
const sessionStateChanged = require('./SessionStateChanged');
const sessionVariableChanged = require('./SessionVariableChanged');
const warning = require('./Warning');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Notice.Frame
 * @param {proto.Mysqlx.Notice.Frame} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Notice.Frame}
 */
function Frame (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Get the name of notice scope.
         * @function
         * @name module:adapters.Mysqlx.Notice.Frame#toJSON
         * @returns {string}
         */
        getScope () {
            return Object.keys(FrameStub.Scope)
                .filter(k => FrameStub.Scope[k] === proto.getScope())[0];
        },

        /**
         * Get the name of the notice type.
         * @function
         * @name module:adapters.Mysqlx.Notice.Frame#toJSON
         * @returns {string}
         */
        getType () {
            return Object.keys(FrameStub.Type)
                .filter(k => FrameStub.Type[k] === proto.getType())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Notice.Frame#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            const frame = { type: this.getType(), scope: this.getScope() };

            switch (proto.getType()) {
            case FrameStub.Type.WARNING:
                return Object.assign({}, frame, { payload: warning.deserialize(bytes(proto.getPayload()).toBuffer()).toJSON() });
            case FrameStub.Type.SESSION_VARIABLE_CHANGED:
                return Object.assign({}, frame, { payload: sessionVariableChanged.deserialize(bytes(proto.getPayload()).toBuffer()).toJSON() });
            case FrameStub.Type.SESSION_STATE_CHANGED:
                return Object.assign({}, frame, { payload: sessionStateChanged.deserialize(bytes(proto.getPayload()).toBuffer()).toJSON() });
            default:
                return frame;
            }
        },

        /**
         * Return a plain JavaScript object version of the underlying protobuf instance.
         * @function
         * @name module:adapters.Mysqlx.Notice.Frame#toObject
         * @returns {Object}
         */
        toObject () {
            const frame = { scope: proto.getScope(), type: proto.getType() };

            switch (proto.getType()) {
            case FrameStub.Type.WARNING:
                return Object.assign({}, frame, { warning: warning.deserialize(bytes(proto.getPayload()).toBuffer()).toObject() });
            case FrameStub.Type.SESSION_VARIABLE_CHANGED:
                return Object.assign({}, frame, { variable: sessionVariableChanged.deserialize(bytes(proto.getPayload()).toBuffer()).toObject() });
            case FrameStub.Type.SESSION_STATE_CHANGED:
                return Object.assign({}, frame, { state: sessionStateChanged.deserialize(bytes(proto.getPayload()).toBuffer()).toObject() });
            default:
                return frame;
            }
        }
    });
}

/**
 * Creates a wrapper from a raw X Protocol message payload.
 * @returns {module:adapters.Mysqlx.Notice.Frame}
 */
Frame.deserialize = function (buffer) {
    return Frame(FrameStub.deserializeBinary(bytes.deserialize(buffer).valueOf()));
};

Frame.MESSAGE_ID = ServerMessagesStub.Type.NOTICE;

module.exports = Frame;
