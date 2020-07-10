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

const OneOfMessageStub = require('../../../Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage;
const crudDelete = require('../../Messages/Crud/Delete');
const crudFind = require('../../Messages/Crud/Find');
const crudUpdate = require('../../Messages/Crud/Update');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Prepare.Prepare.OneOfMessage
 * @param {proto.Mysqlx.Prepare.Prepare.OneOfMessage} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Prepare.Prepare.OneOfMessage}
 */
function OneOfMessage (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the type name of the message.
         * @function
         * @name module:adapters.Mysqlx.Prepare.Prepare.OneOfMessage#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(OneOfMessageStub.Type)
                .filter(k => OneOfMessageStub.Type[k] === proto.getType())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Prepare.Prepare.OneOfMessage#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            const json = { type: this.getType() };

            switch (proto.getType()) {
            case OneOfMessageStub.Type.FIND:
                return Object.assign({}, json, { find: crudFind(proto.getFind()).toJSON() });
            case OneOfMessageStub.Type.UPDATE:
                return Object.assign({}, json, { update: crudUpdate(proto.getUpdate()).toJSON() });
            case OneOfMessageStub.Type.DELETE:
                return Object.assign({}, json, { delete: crudDelete(proto.getDelete()).toJSON() });
            default:
                return json;
            }
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Prepare.Prepare.OneOfMessage instance for a given statement.
 * @param {Preparing} statement
 * @param {Object} [options] - extended options
 * @returns {module:adapters.Mysqlx.Prepare.Prepare.OneOfMessage}
 */
OneOfMessage.create = function (statement, options) {
    const proto = new OneOfMessageStub();

    const type = statement.getType();
    proto.setType(type);

    if (type === OneOfMessageStub.Type.FIND) {
        proto.setFind(crudFind.create(statement, options).valueOf());
    } else if (type === OneOfMessageStub.Type.UPDATE) {
        proto.setUpdate(crudUpdate.create(statement, options).valueOf());
    } else if (type === OneOfMessageStub.Type.DELETE) {
        proto.setDelete(crudDelete.create(statement, options).valueOf());
    }

    return OneOfMessage(proto);
};

module.exports = OneOfMessage;
