/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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
 * This mixin grants placeholder assignment capabilities to a statement
 * instance via composition.
 * @mixin
 * @param {Object} [assignments] - Object containing the mapping between
 * placeholder names and values.
 * @alias Binding
 * @returns {Binding}
 */
function Binding ({ assignments = {} } = {}) {
    return {
        /**
         * Assign a single value to a given placeholder or multiple values
         * to different placeholders when the input is an object where the
         * keys correspond to placeholder names and the values correspond to
         * the values that are assigned to those placeholders.
         * @function
         * @name Binding#bind
         * @param {string|Object} nameOrMultipleAssignments - A placeholder
         * name or an object containing placeholder names and values.
         * @param {string} [value] - A value to be assigned to a single
         * placeholder,
         * @example
         * // parameter name and value as arguments
         * const query = collection.find('foo = :foo').bind('foo', 'bar')
         *
         * // parameter name and value as key-value pair in an object
         * const query = collection.find('foo = :foo').bind({ foo: 'bar' })
         * @returns {Binding} The instance of the statement itself
         * following a fluent API convention.
         */
        bind (nameOrMultipleAssignments, value) {
            if (typeof nameOrMultipleAssignments !== 'string' && typeof nameOrMultipleAssignments !== 'object') {
                return this;
            }

            // If the first argument is a string, it is the placeholder name
            // and the second argument is the placeholder value.
            if (typeof nameOrMultipleAssignments === 'string') {
                assignments[nameOrMultipleAssignments] = value;

                return this;
            }

            // If the first argument is a plain JavaScript object, it contains
            // additional placeholder assignments.
            if (!Array.isArray(nameOrMultipleAssignments) && Object(nameOrMultipleAssignments) === nameOrMultipleAssignments) {
                assignments = { ...assignments, ...nameOrMultipleAssignments };
            }

            return this;
        },

        /**
         * Retrieve the list of placeholder names used by the statement.
         * @private
         * @function
         * @name Binding#getPlaceholders_
         * @returns {string[]} The list of placeholder names.
         */
        getPlaceholders_ () {
            return Object.keys(assignments);
        },

        /**
         * Retrieve the list of values assigned to the statement placeholders.
         * @private
         * @function
         * @name Binding#getPlaceholderValues_
         * @returns {Array<*>} The list of placeholder values.
         */
        getPlaceholderValues_ () {
            return Object.values(assignments);
        }
    };
}

module.exports = Binding;
