/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
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

const binding = require('./Binding');
const limiting = require('./Limiting');
const preparing = require('./Preparing');
const query = require('./Query');
const result = require('./Result');
const tableOrdering = require('./TableOrdering');
const type = require('../Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.DELETE;

const category = query.Type.TABLE;

/**
 * TableDelete factory.
 * @module TableDelete
 * @mixes Binding
 * @mixes Limiting
 * @mixes Query
 * @mixes TableOrdering
 */

/**
 * @private
 * @alias module:TableDelete
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema name
 * @param {string} tableName - table name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {module:TableDelete}
 */
function TableDelete (session, schema, tableName, criteria) {
    const state = { category, criteria: criteria || '', preparable: preparing({ session }), schema, session, tableName, type };
    const base = Object.assign({}, binding(state), limiting(state), query(state), tableOrdering(state));

    state.preparable = Object.assign({}, base, state.preparable);

    return Object.assign({}, base, {
        /**
         * Execute delete query.
         * @function
         * @name module:TableDelete#execute
         * @return {Promise.<module:Result>}
         */
        execute () {
            if (!this.getCriteria().trim().length) {
                return Promise.reject(new Error('An explicit criteria needs to be provided using where().'));
            }

            const fn = () => this.getSession()._client.crudRemove(this);

            return state.preparable.execute(fn)
                .then(details => result(details));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:TableDelete#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableDelete';
        }
    });
}

module.exports = TableDelete;
