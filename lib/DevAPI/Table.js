/*
 * Copyright (c) 2015, 2022, Oracle and/or its affiliates.
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

const DatabaseObject = require('./DatabaseObject');
const ProjectedSearchExprStr = require('./ProjectedSearchExprStr');
const SqlExecute = require('./SqlExecute');
const TableDelete = require('./TableDelete');
const TableInsert = require('./TableInsert');
const TableSelect = require('./TableSelect');
const TableUpdate = require('./TableUpdate');
const errors = require('../constants/errors');
const escapeQuotes = require('./Util/escapeQuotes');
const logger = require('../logger');
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
 * @param {Connection} connection - The instance of the current
 * database connection.
 * @param {module:Schema} schema - The instance of the schema where statements
 * will be executed.
 * @param {string} tableName - The name of the underlying database table.
 * @returns {module:Table}
 */
function Table ({ connection, schema, tableName } = {}) {
    return {
        ...DatabaseObject(connection),

        /**
         * Retrieves the total number of documents in the table.
         * This method executes a statement in the database.
         * @function
         * @name module:Table#count
         * @returns {Promise<number>} A <code>Promise</code> that resolves to
         * the number of documents in the table.
         */
        count: function () {
            const escapedSchemaName = Table.escapeIdentifier(schema.getName());
            const escapedTableName = Table.escapeIdentifier(tableName);

            let count = 0;
            const callback = row => { count = row[0]; };

            return SqlExecute(connection, `SELECT COUNT(*) FROM ${escapedSchemaName}.${escapedTableName}`)
                .execute(callback)
                .then(() => count);
        },

        /**
         * Creates a statement that updates all rows that match a criteria.
         * The criteria is required and should be defined using the
         * {@link module:TableFiltering#where|TableFiltering.where()} method.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Table#delete
         * @example
         * // delete all rows from a table
         * table.delete('true')
         *
         * // delete rows that match a given criteria
         * table.delete('`name` == "foobar"')
         * @returns {module:TableDelete} A new instance of a statement
         * containing the filtering criteria which will be used for
         * determining which rows will be deleted.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tabledeletefunction|TableDeleteFunction}
         */
        delete (searchConditionStr) {
            // The criteria should be defined using the TableFiltering.where()
            // method. Although it still works, defining the criteria in the
            // call to Table.delete() is deprecated.
            if (typeof searchConditionStr !== 'undefined') {
                log.warning('delete', warnings.MESSAGES.WARN_DEPRECATED_TABLE_DELETE_EXPR_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            return TableDelete({ connection, schema, tableName }).where(searchConditionStr);
        },

        /**
         * Checks if this table exists in the database.
         * This method executes a statement in the database.
         * @function
         * @name module:Table#existsInDatabase
         * @returns {Promise<boolean>} A <code>Promise</code> that resolves to a
         * boolean value which indicates whether the table exists or not.
         */
        existsInDatabase () {
            const args = [{ schema: schema.getName(), pattern: tableName }];

            return SqlExecute(connection, 'list_objects', args, SqlExecute.Namespace.X_PLUGIN)
                .execute()
                .then(res => {
                    return res.fetchAll().some(record => record[1] === 'TABLE');
                });
        },

        /**
         * Retrieves the table name.
         * This method works with the local table instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Table#getName
         * @returns {string} The Name of the table.
         */
        getName () {
            return tableName;
        },

        /**
         * Retrieves the instance of the schema where the table lives under.
         * This method works with the local table instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Table#getSchema
         * @returns {module:Schema} The instance of the schema where
         * statements will be executed.
         */
        getSchema () {
            return schema;
        },

        /**
         * Retrieves the table metadata.
         * This method works with the local table instance and does not
         * execute any statement in the database.
         * @function
         * @name module:Table#inspect
         * @returns {Object} An Object containing metadata about the table.
         */
        inspect () {
            return { schema: schema ? schema.getName() : schema, table: tableName };
        },

        /**
         * Creates a statement that inserts one or more rows in the
         * table.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Table#insert
         * @param {...TableFields} tableFields - The Names of the columns
         * where the values will be inserted for each row.
         * @example
         * // arguments as column names
         * table.insert('foo', 'bar')
         *
         * // array of column names
         * table.insert(['foo', 'bar'])
         *
         * // object with column name and value
         * table.insert({ foo: 'baz', bar: 'qux' })
         * @throws Column name is not a valid string or X DevAPI expression instance.
         * @returns {module:TableInsert} A new instance of a statement
         * containing the column names of the rows to be inserted.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableinsertfunction|TableInsertFunction}
         */
        insert (...tableFields) {
            const columns = tableFields.flat()
                .filter(tableField => typeof tableField !== 'undefined');

            const isNonEmptyObject =
                // is an object
                typeof columns[0] === 'object' &&
                // is not an array
                !Array.isArray(columns[0]) &&
                // is not null
                Object(columns[0]) === columns[0] &&
                // is not empty
                Object.keys(columns[0]).length > 0;

            // It is possible to support an object containing the mapping
            // between the column names and values, but this behavior is
            // deprecated.
            if (isNonEmptyObject) {
                log.warning('insert', warnings.MESSAGES.WARN_DEPRECATED_TABLE_INSERT_OBJECT_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });

                return TableInsert({ connection, schema, tableName, columns: Object.keys(columns[0]) })
                    .values(Object.values(columns[0]));
            }

            if (!columns.length || columns.some(field => typeof field !== 'string')) {
                throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
            }

            return TableInsert({ connection, schema, tableName, columns });
        },

        /**
         * Checks if the table is a view (virtual) or an actual table.
         * This method executes a statement in the database.
         * @function
         * @name module:Table#isView
         * @returns {Promise.<boolean>} A <code>Promise</code> that resolves to
         * a boolean that indicates whether the table is a view or not.
         */
        isView () {
            const sqlStatement = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
            const args = ['def', schema.getName(), tableName];

            let status = false;
            const callback = found => { status = !!found.length; };

            return SqlExecute(connection, sqlStatement, args)
                .execute(callback)
                .then(() => status);
        },

        /**
         * Creates a statement that retrieves the values for the given
         * column names on each table row that matches a criteria.
         * The criteria is optional and should be defined using the
         * {@link module:TableFiltering#where|TableFiltering.where()} method.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Table#select
         * @param {...ProjectedSearchExprStrList} [projectedSearchExprStrs] -
         * One or more names of columns to include in the result set.
         * @example
         * // all columns should be projected
         * const selection = table.select()
         *
         * // arguments as columns to be projected
         * const selection = table.select('foo', 'bar')
         *
         * // array of columns to be projected
         * const selection = table.select(['foo', 'bar'])
         * @returns {module:TableSelect} A new instance of a statement
         * containing the names of the columns to include in the result set
         * for all the rows that match the criteria.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableselectfunction|TableSelectFunction}
         */
        select (...projectedSearchExprStrList) {
            const projectionList = projectedSearchExprStrList.flat()
                .map(projectedSearchExprStr => ProjectedSearchExprStr(projectedSearchExprStr).getValue());

            return TableSelect({ connection, projectionList, schema, tableName });
        },

        /**
         * Creates a statement that updates all rows that match a criteria,
         * The criteria is required and should be defined using the
         * {@link module:TableFiltering#where|TableFiltering.where()} method.
         * This method does not cause the statement to be executed.
         * @function
         * @name module:Table#update
         * @example
         * // update all rows in a table
         * table.update('true').set('name', 'foo')
         * table.update().where('true').set('name', 'foo')
         *
         * // update rows that match a given criteria
         * table.update().where('`name` == "foo"').set('name', 'bar')
         * @returns {module:TableUpdate} A new instance of a statement
         * containing the filtering criteria which will be used for
         * determining which rows will be updated.
         * @see {@link https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html#crud-ebnf-tableupdatefunction|TableUpdateFunction}
         */
        update (searchConditionStr) {
            // The criteria should be defined using the TableFiltering.where()
            // method. Although it still works, defining the criteria in the
            // call to Table.update() is deprecated.
            if (typeof searchConditionStr !== 'undefined') {
                log.warning('update', warnings.MESSAGES.WARN_DEPRECATED_TABLE_UPDATE_EXPR_ARGUMENT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            return TableUpdate({ connection, schema, tableName }).where(searchConditionStr);
        }
    };
}

/**
 * Internal utility function.
 */
// TODO(Rui): refactor somehow.
Table.escapeIdentifier = function (ident) {
    return '`' + escapeQuotes(ident) + '`';
};

module.exports = Table;
