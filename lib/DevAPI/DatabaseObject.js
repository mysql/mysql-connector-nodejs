/*
 * Copyright (c) 2015, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const session = require('./Session');

/**
 * This mixin grants an introspection capability that allows a collection
 * or table instance to be aware of the statement execution context in the
 * form of an X DevAPI session, via composition.
 * @mixin
 * @alias DatabaseObject
 * @param {module:Connection} [connection] - The instance of the current
 * database connection.
 * @returns {DatabaseObject}
 */
function DatabaseObject (connection) {
    return {
        /**
         * Retrieve the session context used to execute statements
         * in a table or a collection.
         * @function
         * @name DatabaseObject#getSession
         * @returns {module:Session} The instance of the X DevAPI session
         * where the statements will be executed.
         */
        getSession () {
            return session(connection);
        }
    };
}

module.exports = DatabaseObject;
