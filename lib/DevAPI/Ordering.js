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
 * Ordering mixin.
 * @mixin
 * @private
 * @alias Ordering
 * @param {Object} state - ordering properties
 * @returns {Ordering}
 */
function Ordering (state) {
    state = Object.assign({ orderings: [] }, state);

    return {
        /**
         * Retrieve the list of columns to order in the result.
         * @function
         * @private
         * @name Ordering#getOrderings
         * @returns {string[]} The list of ordering expressions.
         */
        getOrderings () {
            return state.orderings;
        },

        /**
         * Set the list of columns to order in the result.
         * @function
         * @private
         * @name Ordering#setOrderings
         * @param {string[]} orderings - list of ordering expressions
         * @returns {Ordering} The query instance.
         */
        setOrderings (orderings) {
            state.orderings = orderings;

            return this;
        }
    };
}

module.exports = Ordering;
