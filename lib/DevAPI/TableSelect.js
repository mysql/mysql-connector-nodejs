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

const Column = require('./Column');
const binding = require('./Binding');
const grouping = require('./Grouping');
const limiting = require('./Limiting');
const locking = require('./Locking');
const preparing = require('./Preparing');
const projecting = require('./Projecting');
const query = require('./Query');
const result = require('./RowResult');
const tableOrdering = require('./TableOrdering');

const category = query.Type.TABLE;

/**
 * TableSelect factory.
 * @module TableSelect
 * @mixes Binding
 * @mixes Grouping
 * @mixes Limiting
 * @mixes Locking
 * @mixes Projecting
 * @mixes Query
 * @mixes TableOrdering
 */

/**
 * @private
 * @alias module:TableSelect
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableTable - table name
 * @param {string[]} projections - projection expressions
 * @returns {module:TableSelect}
 */
function TableSelect (session, schema, tableName, projections) {
    const state = { allowsOffset: true, category, criteria: 'true', preparable: preparing({ session }), schema, session, tableName };
    const base = Object.assign({}, binding(state), grouping(state), limiting(state), locking(state), projecting({ projections }), query(state), tableOrdering(state));

    state.preparable = Object.assign({}, base, state.preparable);

    return Object.assign({}, base, {
        /**
         * Row cursor.
         * @callback module:TableSelect~rowCursor
         * @param {Array.<*>} items - the list of column values for the row in the current cursor position
         */

        /**
         * Metadata cursor.
         * @callback module:TableSelect~metadataCursor
         * @param {Array.<Object>} metadata - the list of objects containing metadata details for each column
         */

        /**
         * Execute the find query.
         * @function
         * @name module:TableSelect#execute
         * @param {module:TableSelect~rowCursor} [dataCursor]
         * @param {module:TableSelect~metadataCursor} [metadataCursor]
         * @return {Promise.<module:RowResult>}
         */
        execute (dataCursor, metadataCursor) {
            metadataCursor = Column.metaCB(metadataCursor);

            const fn = () => this.getSession()._client.crudFind(this, dataCursor, metadataCursor);

            return state.preparable.execute(fn, dataCursor, metadataCursor)
                .then(details => result(details));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:TableSelect#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableSelect';
        }
    });
}

module.exports = TableSelect;
