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
const collectionOrdering = require('./CollectionOrdering');
const preparing = require('./Preparing');
const query = require('./Query');
const result = require('./Result');
const type = require('../Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.DELETE;

/**
 * CollectionRemove factory.
 * @module CollectionRemove
 * @mixes Binding
 * @mixes Limiting
 * @mixes CollectionOrdering
 * @mixes Query
 */

/**
 * @private
 * @alias module:CollectionRemove
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableName - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {module:CollectionRemove}
 */
function CollectionRemove (session, schema, tableName, criteria) {
    const state = { preparable: preparing({ session }) };
    const base = Object.assign({}, binding({ criteria: criteria || '' }), collectionOrdering(state), limiting(state), query({ schema, session, tableName, type }));

    state.preparable = Object.assign({}, base, state.preparable);

    return Object.assign({}, base, {
        /**
         * Execute remove query.
         * @function
         * @name module:CollectionRemove#execute
         * @return {Promise.<module:Result>}
         */
        execute () {
            if (!this.getCriteria().trim().length) {
                return Promise.reject(new Error('A valid condition needs to be provided with `remove()`'));
            }

            const fn = () => this.getSession()._client.crudRemove(this);

            return state.preparable.execute(fn)
                .then(details => result(details));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:CollectionRemove#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionRemove';
        }
    });
}

module.exports = CollectionRemove;
