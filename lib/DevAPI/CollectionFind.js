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

const Result = require('./Result');
const binding = require('./Binding');
const grouping = require('./Grouping');
const limiting = require('./Limiting');
const locking = require('./Locking');
const ordering = require('./Ordering');
const projecting = require('./Projecting');
const query = require('./Query');

/**
 * CollectionFind factory.
 * @module CollectionFind
 * @mixes Binding
 * @mixes Grouping
 * @mixes Limiting
 * @mixes Locking
 * @mixes Ordering
 * @mixes Projecting
 * @mixes Query
 */

/**
 * @private
 * @alias module:CollectionFind
 * @param {Session} session - session to bind
 * @param {string} schema - schema name
 * @param {string} tableName - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {CollectionFind}
 */
function CollectionFind (session, schemaName, tableName, criteria) {
    criteria = criteria || 'true';

    return Object.assign({}, binding({ criteria }), grouping(), limiting(), locking(), ordering(), projecting(), query({ schemaName, session, tableName }), {
        /**
         * Document property projection expressions.
         * @typedef {ProjectedSearchExprStrList|Expression} ProjectedDocumentExprStr
         */

        /**
         * Pick collection properties for projection.
         * @function
         * @name module:CollectionFind#fields
         * @param {ProjectedDocumentExprStr} projections - expression with the properties to pick
         * @returns {CollectionFind} The query instance.
         */
        fields (projections) {
            if (!Array.isArray(projections)) {
                throw new Error('Argument to fields() must be an array of field selectors');
            }

            return this.setProjections(projections);
        },

        /**
         * Cursor callback.
         * @callback documentCallback
         * @global
         * @param {object} object - the document in the cursor position
         */

        /**
         * Execute find query.
         * @function
         * @name module:CollectionFind#execute
         * @param {documentCallback} [rowcb]
         * @return {Promise.<Result>}
         */
        execute (rowcb) {
            const cursor = rowcb ? row => rowcb(row[0]) : undefined;

            return this.getSession()._client.crudFind(this, cursor).then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:CollectionFind#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionFind';
        }
    });
}

module.exports = CollectionFind;
