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

const Column = require('./Column');
const Result = require('./Result');
const binding = require('./Binding');
const query = require('./Query');
const grouping = require('./Grouping');
const limiting = require('./Limiting');
const locking = require('./Locking');
const projecting = require('./Projecting');
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
 * @param {string} schemaName - schema name
 * @param {string} tableTable - table name
 * @param {string[]} projections - projection expressions
 * @returns {TableSelect}
 */
function TableSelect (session, schemaName, tableName, projections) {
    return Object.assign({}, binding({ category, criteria: 'true' }), grouping(), limiting(), locking(), projecting({ projections }), query({ category, schemaName, session, tableName }), tableOrdering(), {
        /**
         * Execute the find query.
         * @function
         * @name module:TableSelect#execute
         * @param {documentCallback} [rowcb]
         * @param {Array<Column>} [metacb]
         * @return {Promise.<Result>}
         */
        execute (rowcb, metacb) {
            const metaCursor = Column.metaCB(metacb);

            return this.getSession()._client.crudFind(this, rowcb, metaCursor).then(state => new Result(state));
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
        },

        /**
         * Build a view for the query.
         * @function
         * @name module:TableSelect#getViewDefinition
         * @returns {string} The view SQL string.
         */
        getViewDefinition () {
            // TODO(rui.quelhas): check if this is the best place to escape the interpolated properties
            // console.log(Table, new Table(), Table.escapeIdentifier);
            // let retval = "SELECT " + this.getProjections().join(", ") + " FROM " + Table.escapeIdentifier(this.getSchemaName()) + '.' + Table.escapeIdentifier(this.getTableName());
            let view = `SELECT ${this.getProjections().join(', ')} FROM ${this.getSchemaName()}.${this.getTableName()}`;

            if (this.getCriteria() !== 'true') {
                view = `${view} WHERE ${this.getCriteria()}`;
            }

            if (this.getOrderings().length) {
                view = `${view} ORDER BY ${this.getOrderings().join(', ')}`;
            }

            return view;
        }
    });
}

module.exports = TableSelect;
