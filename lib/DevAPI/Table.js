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

const databaseObject = require('./DatabaseObject');
const errors = require('../constants/errors');
const escapeQuotes = require('./Util/escapeQuotes');
const logger = require('../logger');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const sqlExecute = require('./SqlExecute');
const tableDelete = require('./TableDelete');
const tableInsert = require('./TableInsert');
const tableSelect = require('./TableSelect');
const tableUpdate = require('./TableUpdate');
const warnings = require('../constants/warnings');

/**
 * Table factory.
 * @module Table
 * @mixes DatabaseObject
 */

const log = logger('api:table');

/**
 * @private
 * @alias module:Table
 * @param {Connection} connection - database connection context
 * @param {module:Schema} schema - schema to bind
 * @param {string} name - table name
 * @returns {module:Table}
 */
function Table (connection, schema, name) {
    const state = Object.assign({}, { name, schema });

    return Object.assign({}, databaseObject(connection), {
        /**
         * Retrieve the total number of rows in the table.
         * @function
         * @name module:Table#count
         * @returns {Promise.<number>}
         */
        count: function () {
            const schema = Table.escapeIdentifier(this.getSchema().getName());
            const table = Table.escapeIdentifier(this.getName());

            let count = 0;
            const callback = row => { count = row[0]; };

            return sqlExecute(connection, `SELECT COUNT(*) FROM ${schema}.${table}`)
                .execute(callback)
                .then(() => count);
        },

        /**
         * Create operation to delete rows from a table.
         * @function
         * @name module:Table#delete
         * @param {SearchConditionStr} [expr] - filtering criteria
         * @example
         * // delete all rows from a table
         * table.delete('true')
         *
         * // delete rows that match a given criteria
         * table.delete('`name` == "foobar"')
         * @returns {module:TableDelete} The operation instance.
         */
        delete (expr) {
            if (typeof expr !== 'undefined') {
                log.warning('delete', warnings.MESSAGES.WARN_DEPRECATED_TABLE_DELETE_EXPR_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            return tableDelete(connection, this.getSchema(), this.getName(), expr);
        },

        /**
         * Check if the table exists in the database.
         * @function
         * @name module:Table#existsInDatabase
         * @returns {Promise.<boolean>}
         */
        existsInDatabase () {
            const args = [{ schema: this.getSchema().getName(), pattern: this.getName() }];

            // table name must be stringified since the plugin is converting it to BINARY somehow
            return sqlExecute(connection, 'list_objects', args, sqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(res => {
                    return res.fetchAll().some(record => record[1] === 'TABLE');
                });
        },

        /**
         * Retrieve the table name.
         * @function
         * @name module:Table#getName
         * @returns {string}
         */
        getName () {
            return state.name;
        },

        /**
         * Retrieve the schema associated to the table.
         * @function
         * @name module:Table#getSchema
         * @returns {module:Schema}
         */
        getSchema () {
            return state.schema;
        },

        /**
         * Retrieve the table metadata.
         * @function
         * @name module:Table#inspect
         * @returns {Object} An object containing the relevant metadata.
         */
        inspect () {
            return { schema: this.getSchema() ? this.getSchema().getName() : this.getSchema(), table: this.getName() };
        },

        /**
         * Create operation to insert rows in the table.
         * @function
         * @name module:Table#insert
         * @param {...string|string[]|Object} fields - column names or column-value object
         * @throws {Error} When the input type is invalid.
         * @example
         * // arguments as column names
         * table.insert('foo', 'bar')
         *
         * // array of column names
         * table.insert(['foo', 'bar'])
         *
         * // object with column name and value
         * table.insert({ foo: 'baz', bar: 'qux' })
         * @returns {module:TableInsert} The operation instance.
         */
        insert () {
            if (!Array.isArray(arguments[0]) && typeof arguments[0] !== 'string') {
                log.warning('insert', warnings.MESSAGES.WARN_DEPRECATED_TABLE_INSERT_OBJECT_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });

                const fields = arguments[0];

                if (typeof fields !== 'object') {
                    throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
                }

                const columns = Object.keys(fields);
                const values = columns.map(column => fields[column]);

                return tableInsert(connection, this.getSchema(), this.getName(), columns).values(values);
            }

            const columns = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            return tableInsert(connection, this.getSchema(), this.getName(), columns);
        },

        /**
         * Check whether the table is a view.
         * @function
         * @name module:Table#isView
         * @returns {Promise.<boolean>}
         */
        isView () {
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
            const args = ['def', this.getSchema().getName(), this.getName()];

            let status = false;
            const callback = found => { status = !!found.length; };

            return sqlExecute(connection, query, args)
                .execute(callback)
                .then(() => status);
        },

        /**
         * Create operation to select rows from the table.
         * @function
         * @name module:Table#select
         * @param {...string|string[]} [expr] - columns to be projected
         * @throws {Error} When an expression is invalid.
         * @example
         * // all columns should be projected
         * const selection = table.select()
         *
         * // arguments as columns to be projected
         * const selection = table.select('foo', 'bar')
         *
         * // array of columns to be projected
         * const selection = table.select(['foo', 'bar'])
         * @returns {module:TableSelect} The operation instance.
         */
        select () {
            const fields = parseFlexibleParamList(Array.prototype.slice.call(arguments));

            return tableSelect(connection, this.getSchema(), this.getName(), fields);
        },

        /**
         * Create operation to update rows in the table.
         * @function
         * @name module:Table#update
         * @param {string} [expr] - filtering criteria
         * @example
         * // update all rows in a table
         * table.update('true').set('name', 'foo')
         * table.update().where('true').set('name', 'foo')
         *
         * // update rows that match a given criteria
         * table.update().where('`name` == "foo"').set('name', 'bar')
         * @returns {module:TableUpdate} The operation instance.
         */
        update (expr) {
            if (typeof expr !== 'undefined') {
                log.warning('update', warnings.MESSAGES.WARN_DEPRECATED_TABLE_UPDATE_EXPR_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            return tableUpdate(connection, this.getSchema(), this.getName(), expr);
        }
    });
}

/**
 * Internal utility function.
 */
// TODO(Rui): refactor somehow.
Table.escapeIdentifier = function (ident) {
    return '`' + escapeQuotes(ident) + '`';
};

module.exports = Table;
