/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
const statement = require('./Statement');

function StmtExecute (session, raw, args, namespace) {
    return Object.assign({}, statement({ args: args || [], raw, namespace: namespace || statement.Type.CLASSIC, session }), {

        /**
         * Execute a raw SQL query.
         * @param {Function|Object} rowcb - Callback function to handle results, or an object with both callback functions.
         * @param {Function} [metacb] - Callback function to handle metadata.
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

            return this.getSession()._client.sqlStmtExecute(this, rowcb, metacb);
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @private
         * @name module:StmtExecute#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'StmtExecute';
        }
    });
}

StmtExecute.Namespace = statement.Type;

module.exports = StmtExecute;
