/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

const Result = require('./Result');
const binding = require('./Binding');
const grouping = require('./Grouping');
const limiting = require('./Limiting');
const locking = require('./Locking');
const ordering = require('./Ordering');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
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
         * Pick collection properties for projection.
         * @function
         * @name module:CollectionFind#fields
         * @param {string[]|string} projections - expression with the properties to pick
         * @returns {CollectionFind} The query instance.
         */
        fields () {
            return this.setProjections(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
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
