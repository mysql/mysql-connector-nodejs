/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
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

/**
 * AuthenticationManager factory.
 * @private
 * @alias AuthenticationManager
 * @returns {AuthenticationManager}
 */
function AuthenticationManager () {
    const state = { plugins: [] };

    return {
        /**
         * Register a new authentication plugin.
         * @function
         * @name module:AuthenticationManager#registerPlugin
         * @param {AuthPlugin} plugin - AuthPlugin implementation
         * @returns {AuthenticationManager} The AuthenticationManager singleton instance.
         */
        registerPlugin (plugin) {
            state.plugins[plugin.Name] = plugin;

            return this;
        },

        /**
         * Retrieve a plugin implementation.
         * @function
         * @name module:AuthenticationManager#registerPlugin
         * @param {string} name - plugin name
         * @returns {AuthPlugin} An AuthPlugin implementation.
         */
        getPlugin (name) {
            return state.plugins[name];
        },

        /**
         * Retrieve the list of names of available plugins.
         * @function
         * @name module:AuthenticationManager#getPluginNames
         * @returns {string[]} The list of plugin names.
         */
        getPluginNames () {
            return Object.keys(state.plugins);
        }
    };
}

/**
 * Exposes an AuthenticationManager singleton.
 */
module.exports = AuthenticationManager();
