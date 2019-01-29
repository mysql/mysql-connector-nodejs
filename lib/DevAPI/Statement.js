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

const Type = { CLASSIC: 'sql', X_PLUGIN: 'mysqlx' };

/**
 * Statement mixin.
 * @mixin
 * @private
 * @alias Statement
 * @param {Object} state - Statement properties
 * @returns {Statement}
 */
function Statement (state) {
    state = Object.assign({ args: [], namespace: Type.CLASSIC, raw: '' }, state);

    return {
        /**
         * Assign one or more placeholder values.
         * @function
         * @name Statement#addArgs
         * @param {Array.<*>} args - one or more arguments
         * @returns {Statement} The query instance.
         */
        addArgs (args) {
            state.args = state.args.concat(args);

            return this;
        },

        /**
         * Retrieve the list of placeholder assignment arguments.
         * @function
         * @private
         * @name Statement#getArgs
         * @returns {Array.<*>} The list of arguments.
         */
        getArgs () {
            return state.args;
        },

        /**
         * Retrieve the MySQL protocol namespace in which the statement will be executed.
         * @function
         * @private
         * @name Statement#getNamespace
         * @returns {Type} The MySQL protocol namespace enum value.
         */
        getNamespace () {
            return state.namespace;
        },

        /**
         * Retrieve the raw SQL statement string.
         * @function
         * @private
         * @name Statement#getSQL
         * @returns {string} The raw SQL statement.
         */
        getSQL () {
            return state.raw;
        },

        /**
         * Retrieve the session bound to the statement.
         * @function
         * @private
         * @name Statement#getSession
         * @returns {Session} The session instance.
         */
        getSession () {
            return state.session;
        }
    };
}

/**
 * MySQL protocol namespace.
 * @type {Type}
 * @const
 * @private
 */
Statement.Type = Type;

module.exports = Statement;
