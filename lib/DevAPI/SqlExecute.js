/*
 * Copyright (c) 2018, 2022, Oracle and/or its affiliates.
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

const ColumnWrapper = require('./Util/columnWrapper');
const Result = require('./SqlResult');
const logger = require('../logger');
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const statement = require('./Statement');
const warnings = require('../constants/warnings');

const log = logger('api:session:sql');

/**
 * SqlExecute factory.
 * @module SqlExecute
 * @mixes Statement
 */

/**
 * @private
 * @alias module:SqlExecute
 * @param {Connection} connection - database connection context
 * @param {string} raw - SQL statement
 * @param {Array.<*>} args - placeholder assignments
 * @param {Type} namespace - MySQL protocol namespace
 * @returns {SqlExecute}
 */
function SqlExecute (connection, raw, args, namespace) {
    return Object.assign({}, statement({ args: args || [], raw, namespace: namespace || statement.Type.CLASSIC }), {
        /**
         * Bind values to ordinal query placeholders.
         * @function
         * @name module:SqlExecute#bind
         * @param {string|string[]} values - one or more values to bind
         * @example
         * // values as arguments
         * const query = session.sql('SELECT FROM person WHERE name = ? AND age = ?').bind('foo', 23)
         *
         * // values as a single array argument
         * const query = session.sql('SELECT FROM person WHERE name = ? AND age = ?').bind(['foo', 23])
         * @returns {module:SqlExecute} The query instance.
         */
        bind () {
            return this.addArgs(parseFlexibleParamList(Array.prototype.slice.call(arguments)));
        },

        /**
         * Row cursor.
         * @callback module:SqlExecute~rowCursor
         * @param {Array.<*>} items - the list of column values for the row in the current cursor position
         */

        /**
         * Metadata cursor.
         * @callback module:SqlExecute~metadataCursor
         * @param {Array.<Object>} metadata - the list of objects containing metadata details for each column
         */

        /**
         * Execute a raw SQL query.
         * @function
         * @name module:SqlExecute#execute
         * @param {module:SqlExecute~rowCursor} rowcb - Callback function to handle results, or an object with both callback functions.
         * @param {module:SqlExecute~metadataCursor} [metacb] - Callback function to handle metadata.
         * @example
         * // provide only a callback to handle results
         * query.execute(result => {})
         * query.execute({ result () {} })
         *
         * // provide only a callback to handle metadata
         * query.execute({ meta () {} })
         *
         * // provide callbacks to handle results and metadata
         * query.execute(result => {}, meta => {})
         * query.execute({ result () {}, meta () {} })
         * @returns {Promise<module:SqlResult>}
         */
        execute (dataCursor, metadataCursor) {
            // Before trying to send any message to the server, we need to
            // check if the connection is open (has a client instance) or if
            // it became idle in the meantime.
            if (!connection.isOpen() || connection.isIdle()) {
                // There is always a default error (ER_DEVAPI_CONNECTION_CLOSED).
                return Promise.reject(connection.getError());
            }

            let rowcb = dataCursor;
            let metacb = metadataCursor;

            // The object syntax is not supported neither by the TableSelect
            // API nor any other connector, so we are deprecating it.
            if (typeof dataCursor === 'object') {
                log.warning('execute', warnings.MESSAGES.WARN_DEPRECATED_EXECUTE_CURSOR_OBJECT, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });

                rowcb = dataCursor.row;
                metacb = dataCursor.meta;
            }

            const integerType = connection.getIntegerType();
            // In DOCUMENT mode, the result set is composed by the values of
            // every projected column, which are available as a JavaScript
            // array that corresponds to the row list.
            const cursor = rowcb ? row => rowcb(row?.toArray({ integerType })) : undefined;

            return connection.getClient().sqlStmtExecute(this, cursor, ColumnWrapper(metacb))
                .then(details => {
                    // We want to be able to reuse the statements and execute
                    // them either with the same or with different placeholder
                    // values. For that, we need to freeze the statement, in
                    // order to ensure that new placeholder values will
                    // replace old ones when it is executed again. Otherwise,
                    // if we keep adding new values to the same statement
                    // instance, the server (X Plugin) will report a 5015
                    // ("Too many arguments") error.
                    this.freeze();

                    return Result({ ...details, integerType });
                });
        }
    });
}

/**
 * MySQL protocol namespace.
 * @type {Type}
 * @const
 */
SqlExecute.Namespace = statement.Type;

module.exports = SqlExecute;
