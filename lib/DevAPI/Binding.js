'use strict';

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

/**
 * Binding mixin.
 * @mixin
 * @alias Binding
 * @param {Object} state - binding properties
 * @returns {Binding}
 */
function Binding (state) {
    state = Object.assign({ bindings: {} }, state);

    return {
        /**
         * Bind values to query parameters.
         * @function
         * @name Binding#bind
         * @param {string|Object} parameter - parameter name or mapping object
         * @param {string} [value]
         * @example
         * // parameter name and value as arguments
         * const query = collection.find('$.foo == :foo').bind('foo', 'bar')
         *
         * // parameter name and value as key-value pair in an object
         * const query = collection.find('$.foo == :foo').bind({ foo: 'bar' })
         * @returns {Binding} The operation instance.
         */
        bind () {
            if (!arguments.length) {
                return this;
            }

            let assignment;

            if (Object(arguments[0]) === arguments[0]) {
                assignment = arguments[0];
            } else {
                assignment = { [arguments[0]]: arguments[1] };
            }

            state.bindings = Object.assign({}, state.bindings, assignment);

            return this;
        },

        /**
         * Retrieve the operation bindings.
         * @function
         * @name Binding#getBindings
         * @returns {object} The set of parameters and associated values.
         */
        getBindings () {
            return state.bindings;
        }
    };
}

module.exports = Binding;
