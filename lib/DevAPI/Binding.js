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

const filtering = require('./Filtering');
const query = require('./Query');
const tableFiltering = require('./TableFiltering');

const category = query.Type.DOCUMENT;

/**
 * Binding mixin.
 * @mixin
 * @alias Binding
 * @param {Object} state - binding properties
 * @returns {Binding}
 */
function Binding (state) {
    state = Object.assign({ category, bindings: {} }, state);

    const base = {
        /**
         * Bind values to query parameters.
         * @function
         * @name Binding#bind
         * @param {string|Object} parameter - parameter name or mapping object
         * @param {string} [value]
         * @example
         * // parameter name and value as arguments
         * const query = collection.find('foo = :foo').bind('foo', 'bar')
         *
         * // parameter name and value as key-value pair in an object
         * const query = collection.find('foo = :foo').bind({ foo: 'bar' })
         * @returns {Binding} The query instance.
         */
        bind () {
            if (!arguments.length) {
                return this;
            }

            let binding = {};

            if (Object(arguments[0]) === arguments[0]) {
                binding = arguments[0];
            } else {
                binding = { [arguments[0]]: arguments[1] };
            }

            return this.setBindings(Object.assign({}, state.bindings, binding));
        },

        /**
         * Retrieve the mapping of placeholders and values to bind.
         * @function
         * @private
         * @name Binding#getBindings
         * @returns {Object} The object containing the placeholder names and their values.
         */
        getBindings () {
            return state.bindings;
        },

        /**
         * Set the mapping of placeholders and values to bind.
         * @function
         * @private
         * @name Binding#setBindings
         * @param {Object} bindings - object with placeholders and values
         * @returns {Binding} The query instance.
         */
        setBindings (bindings) {
            state.bindings = bindings;

            return this;
        }
    };

    if (state.category === query.Type.DOCUMENT) {
        return Object.assign({}, filtering(state), base);
    }

    return Object.assign({}, tableFiltering(state), base);
}

module.exports = Binding;
