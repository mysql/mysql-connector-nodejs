/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

'use strict';

/**
 * Enum to identify data-model types and parser modes.
 * @readonly
 * @private
 * @name DataModel
 * @enum {number}
 */
const DataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel;

/**
 * Query mixin.
 * @mixin
 * @private
 * @alias Query
 * @param {Object} state
 * @returns {Query}
 */
function Query (state) {
    state = Object.assign({ category: DataModel.DOCUMENT }, state);

    return {
        /**
         * Retrieve the category of the entity bound to the query.
         * @function
         * @private
         * @name module:Query#getCategory
         * @returns {Type} The category enum value.
         */
        getCategory () {
            return state.category;
        },

        /**
         * Retrieve the name of the schema bound to the query.
         * @function
         * @private
         * @name module:Query#getSchemaName
         * @returns {string} The schema name.
         */
        getSchemaName () {
            return state.schemaName;
        },

        /**
         * Retrieve the session bound to the query.
         * @function
         * @private
         * @name module:Query#getSession
         * @returns {Session} The session object.
         */
        getSession () {
            return state.session;
        },

        /**
         * Retrieve the name of the entity bound to the query.
         * @function
         * @private
         * @name module:Query#getTableName
         * @returns {string} The entity name.
         */
        getTableName () {
            return state.tableName;
        }
    };
}

/**
 * Database entity types.
 * @type {DataModel}
 * @const
 */
Query.Type = DataModel;

module.exports = Query;
