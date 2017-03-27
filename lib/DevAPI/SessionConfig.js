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

/**
 * Custom session configuration descriptive object.
 * @module SessionConfig
 */

/**
 * Create a session configuration object.
 * @private
 * @alias module:SessionConfig
 * @returns {SessionConfig}
 */
function SessionConfig (name, uri) {
    const state = { name, uri, appdata: {} };

    return {
        /**
         * Get the value of an application parameter.
         * @function
         * @name module:SessionConfig#getAppData
         * @param {string} key - application parameter name
         * @returns {*} The parameter value.
         */
        getAppData (key) {
            return state.appdata[key];
        },

        /**
         * Get the session name.
         * @function
         * @name module:SessionConfig#getName
         * @returns {string} The session name.
         */
        getName () {
            return state.name;
        },

        /**
         * Get the session URI.
         * @function
         * @name module:SessionConfig#getUri
         * @returns {string} The session URI.
         */
        getUri () {
            return state.uri;
        },

        /**
         * Set an application parameter value.
         * @function
         * @name module:SessionConfig#setAppData
         * @param {string} key - application parameter name
         * @param {string} value - application parameter value
         * @returns {SessionConfig} The session configuration instance.
         */
        setAppData (key, value) {
            state.appdata[key] = value;

            return this;
        }
    };
};

module.exports = SessionConfig;
