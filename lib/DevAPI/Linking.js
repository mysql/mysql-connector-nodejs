/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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
 * Linking mixin.
 * @mixin
 * @alias Linking
 * @param {object} state - linking properties
 * @returns {Linking}
 */
function Linking (state) {
    state = Object.assign({}, { links: {} }, state);

    return {
        /**
         * Remove all the existing entity join links.
         * @function
         * @name Linking#clearAllLinks
         */
        clearAllLinks () {
            this.links = {};
        },

        /**
         * Retrieve the existing entity join links.
         * @function
         * @name Linking#clearAllLinks
         * @returns {Object} The set of join links.
         */
        getLinks () {
            return state.links;
        },

        /**
         * Remove a join link from the entity.
         * @function
         * @name Linking#removeLink
         * @param {string} name - link name
         * @returns {Linking} The entity instance.
         */
        removeLink (name) {
            if (!state.links[name]) {
                throw new Error('The link is not defined');
            }

            delete state.links[name];
            return this;     
        }
    }
}

module.exports = Linking;
