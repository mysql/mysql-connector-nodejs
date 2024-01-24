/*
 * Copyright (c) 2018, 2024, Oracle and/or its affiliates.
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

/**
 * AuthPlugin mixin.
 * @mixin
 * @private
 * @alias AuthPlugin
 * @param {Object} state - plugin properties
 * @returns {AuthPlugin}
 */
function AuthPlugin (state) {
    // TODO(Rui): remove "dbPassword" and "dbUser" after deprecation period
    state = Object.assign({ user: state && (state.dbUser || state.user), password: (state && (state.password || state.dbPassword)) || '' }, state, { schema: state.schema || '' });

    return {
        /**
         * Retrieve the MySQL authentication plugin account user name.
         * @function
         * @name module:AuthPlugin#getUser
         * @returns {string} The MySQL account user name.
         */
        getUser () {
            return state.user;
        },

        /**
         * Retrieve the MySQL authentication plugin account password.
         * @function
         * @name module:AuthPlugin#getPassword
         * @returns {string} The MySQL account password.
         */
        getPassword () {
            return state.password;
        },

        getSchema () {
            return state.schema;
        },

        /**
         * Start the authentication process.
         * @function
         * @name module:AuthPlugin#getPassword
         * @param {Client} client - client instance
         * @returns {Promise}
         */
        run (client) {
            return client.authenticate(this);
        }
    };
}

module.exports = AuthPlugin;
