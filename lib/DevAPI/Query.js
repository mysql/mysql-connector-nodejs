/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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
 * Enum to identify data-model types and parser modes.
 * @readonly
 * @name DataModel
 * @enum {number}
 * @example
 * DataModel.TABLE
 * DataModel.DOCUMENT
 */
const DataModel = require('../Protocol/Protobuf/Stubs/mysqlx_crud_pb').DataModel;
const MessageType = require('../Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type;

/**
 * Query mixin.
 * @mixin
 * @private
 * @alias Query
 * @param {Object} state
 * @returns {Query}
 */
function Query (state) {
    state = Object.assign({ category: DataModel.DOCUMENT, type: MessageType.FIND }, state);

    return {
        /**
         * Retrieve the category of the entity bound to the query.
         * @function
         * @private
         * @name Query#getCategory
         * @returns {Type} The category enum value.
         */
        getCategory () {
            return state.category;
        },

        /**
         * Retrieve the schema instance bound to the query.
         * @function
         * @private
         * @name Query#getSchema
         * @returns {module:Schema} The schema where the query will execute.
         */
        getSchema () {
            return state.schema;
        },

        /**
         * Retrieve the session bound to the query.
         * @function
         * @private
         * @name Query#getSession
         * @returns {Session} The session object.
         */
        getSession () {
            return state.session;
        },

        /**
         * Retrieve the name of the entity bound to the query.
         * @function
         * @private
         * @name Query#getTableName
         * @returns {string} The entity name.
         */
        getTableName () {
            return state.tableName;
        },

        /**
         * Retrieve the type of statement.
         * @function
         * @private
         * @name Query#getType
         * @returns {proto.Mysqlx.Prepare.Prepare.OneOfMessage.Type} The statement type enum.
         */
        getType () {
            return state.type;
        }
    };
}

/**
 * Database entity types.
 * @type {DataModel}
 * @const
 * @private
 */
Query.Type = DataModel;

module.exports = Query;
