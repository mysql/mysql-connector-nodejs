/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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
const parseFlexibleParamList = require('./Util/parseFlexibleParamList');
const statement = require('./Statement');
const result = require('./SqlResult');

/**
 * SqlExecute factory.
 * @module SqlExecute
 * @mixes Statement
 */

/**
 * @private
 * @alias module:SqlExecute
 * @param {Session} session - session to bind
 * @param {string} raw - SQL statement
 * @param {Array.<*>} args - placeholder assignments
 * @param {Type} namespace - MySQL protocol namespace
 * @returns {SqlExecute}
 */
function SqlExecute (session, raw, args, namespace) {
    return Object.assign({}, statement({ args: args || [], raw, namespace: namespace || statement.Type.CLASSIC, session }), {
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
         * @returns {Promise}
         */
        execute () {
            // TODO(Rui): use default values after upgrading the node.js engine to a later major version.
            const rowcb = arguments[0] && typeof arguments[0] === 'object'
                ? arguments[0].row : arguments[0];
            const metacb = arguments[0] && typeof arguments[0] === 'object'
                ? Column.metaCB(arguments[0].meta) : Column.metaCB(arguments[1]);

            return this.getSession()._client.sqlStmtExecute(this, rowcb, metacb)
                .then(details => result(details));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:SqlExecute#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'SqlExecute';
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
