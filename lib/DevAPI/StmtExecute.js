/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
