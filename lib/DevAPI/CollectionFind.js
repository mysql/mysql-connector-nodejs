/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates.
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
const collectionOrdering = require('./CollectionOrdering');
const grouping = require('./Grouping');
const locking = require('./Locking');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const preparing = require('./Preparing');
const projecting = require('./Projecting');
const query = require('./Query');
const result = require('./DocResult');
const skipping = require('./Skipping');
const type = require('../Protocol/Stubs/mysqlx_prepare_pb').Prepare.OneOfMessage.Type.FIND;

/**
 * CollectionFind factory.
 * @module CollectionFind
 * @mixes Binding
 * @mixes Grouping
 * @mixes Skipping
 * @mixes Locking
 * @mixes CollectionOrdering
 * @mixes Projecting
 * @mixes Query
 */

/**
 * @private
 * @alias module:CollectionFind
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableName - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {module:CollectionFind}
 */
function CollectionFind (session, schema, tableName, criteria) {
    const state = { preparable: preparing({ session }) };
    const base = Object.assign({}, binding({ criteria }), collectionOrdering(state), grouping(state), locking(state), projecting(), query({ schema, session, tableName, type }), skipping(state));

    state.preparable = Object.assign({}, base, state.preparable);

    return Object.assign({}, base, {
        /**
         * Pick collection properties for projection.
         * @function
         * @name module:CollectionFind#fields
         * @param {string[]|string} projections - expression with the properties to pick
         * @returns {module:CollectionFind} The query instance.
         */
        fields () {
            state.preparable.forceRestart();

            return this.setProjections(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        },

        /**
         * Document cursor.
         * @callback module:CollectionFind~documentCursor
         * @param {object} object - the document in the current cursor position
         */

        /**
         * Execute find query.
         * @function
         * @name module:CollectionFind#execute
         * @param {module:CollectionFind~documentCursor} [dataCursor] - callback function to handle results
         * @return {Promise.<module:DocResult>}
         */
        execute (dataCursor) {
            const cursor = dataCursor ? row => dataCursor(row[0]) : undefined;
            const fn = () => this.getSession()._client.crudFind(this, cursor);

            return state.preparable.execute(fn, cursor)
                .then(details => result(details));
        }
    });
}

module.exports = CollectionFind;
