/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const DocumentPathItemStub = require('../../../Stubs/mysqlx_expr_pb').DocumentPathItem;
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.DocumentPathItem
 * @param {proto.Mysqlx.Expr.DocumentPathItem} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.DocumentPathItem}
 */
function DocumentPathItem (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the item type name.
         * @function
         * @name module:adapters.Mysqlx.Expr.DocumentPathItem#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(DocumentPathItemStub.Type)
                .filter(k => DocumentPathItemStub.Type[k] === proto.getType())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.DocumentPathItem#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return Object.assign({}, proto.toObject(), { type: this.getType() });
        }
    });
}

/**
 * Encode an column identifier expression tree structure into the corresponding
 * protobuf message.
 * @param {string} [type] - The type of the document path element.
 * @param {string|number} [value] - An array index or the member name.
 * @returns {proto:Mysqlx.Expr.Identifier}
 */
DocumentPathItem.encode = ({ type, value }) => {
    const proto = new DocumentPathItemStub();

    switch (type) {
    case 'member': {
        proto.setType(DocumentPathItemStub.Type.MEMBER);
        proto.setValue(value);
        break;
    }
    case 'memberAsterisk': {
        proto.setType(DocumentPathItemStub.Type.MEMBER_ASTERISK);
        break;
    }
    case 'arrayIndex': {
        proto.setType(DocumentPathItemStub.Type.ARRAY_INDEX);
        proto.setIndex(value);
        break;
    }
    case 'arrayIndexAsterisk': {
        proto.setType(DocumentPathItemStub.Type.ARRAY_INDEX_ASTERISK);
        break;
    }
    case 'doubleAsterisk': {
        proto.setType(DocumentPathItemStub.Type.DOUBLE_ASTERISK);
        break;
    }
    }

    return proto;
};

module.exports = DocumentPathItem;
