/*
 * Copyright (c) 2015, 2021, Oracle and/or its affiliates.
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
const errors = require('../constants/errors');
const limiting = require('./Limiting');
const collectionOrdering = require('./CollectionOrdering');
const preparing = require('./Preparing');
const query = require('./Query');
const result = require('./Result');
const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.DELETE;
const util = require('util');

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
 * @param {Connection} connection - database connection context
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableName - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {module:CollectionRemove}
 */
function CollectionRemove (connection, schema, tableName, criteria) {
    const state = { preparable: preparing({ connection }) };
    const base = Object.assign({}, binding({ criteria: criteria || '' }), collectionOrdering(state), limiting(state), query({ schema, tableName, type }));

    state.preparable = Object.assign({}, base, state.preparable);

    return Object.assign({}, base, {
        /**
         * Execute remove query.
         * @function
         * @name module:CollectionRemove#execute
         * @return {Promise.<module:Result>}
         */
        execute () {
            const criteria = this.getCriteria().trim();
            // An explicit criteria needs to be provided. This is to avoid
            // updating all documents in a collection by mistake.
            if (!criteria.length) {
                return Promise.reject(new Error(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'remove()')));
            }

            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            const fn = () => connection.getClient().crudRemove(this);

            return state.preparable.execute(fn)
                .then(details => result(details));
        }
    });
}

module.exports = CollectionRemove;
