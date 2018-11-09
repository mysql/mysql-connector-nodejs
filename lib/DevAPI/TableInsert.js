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

const inserting = require('./Inserting');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const query = require('./Query');
const result = require('./Result');

const category = query.Type.TABLE;

/**
 * TableInsert factory.
 * @module TableInsert
 * @mixes Query
 * @mixes Inserting
 */

/**
 * @private
 * @alias module:TableInsert
 * @param {Session} session - session to bind
 * @param {module:Schema} schema - schema to bind
 * @param {string} tableName - table name
 * @param {string[]} [columns] - list of column names
 * @returns {module:TableInsert}
 */
function TableInsert (session, schema, tableName, columns) {
    return Object.assign({}, inserting({ columns }), query({ category, schema, session, tableName }), {
        /**
         * Execute the insert query.
         * @function
         * @name module:TableInsert#execute
         * @returns {Promise.<module:Result>}
         */
        execute () {
            return this.getSession()._client.crudInsert(this)
                .then(details => result(details));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:TableInsert#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'TableInsert';
        },

        /**
         * Set row values.
         * @function
         * @name module:TableInsert:values
         * @param {...string|string[]} ExprOrLiteral - column values
         * @throws {Error} When there is a mismatch with the number columns in the query.
         * @example
         * // arguments as column values
         * table.insert('foo', 'bar').values('baz', 'qux')
         * table.insert(['foo', 'bar']).values('baz', 'qux')
         *
         * // array of column values
         * table.insert('foo', 'bar').values(['baz', 'qux'])
         * table.insert(['foo', 'bar']).values(['baz', 'qux'])
         *
         * // comma-separated string with column values
         * table.insert('foo', 'bar').values('baz, qux'])
         * table.insert(['foo', 'bar']).values('baz, qux')
         *
         * // chaining multiple inserts
         * table.insert('foo', 'bar')
         *      .values(['baz', 'qux'])
         *      .values(['quux', 'biz'])
         *      .values('foo, bar')
         * @returns {module:TableInsert} The query instance
         */
        values () {
            const values = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            if (this.getColumns().length !== values.length) {
                throw new Error(`Mismatch in column count. ${this.getColumns().length} fields listed, ${values.length} values provided`);
            }

            return this.setItems(this.getItems().concat([values]));
        }
    });
}

module.exports = TableInsert;
