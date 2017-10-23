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
 * Limiting mixin.
 * @mixin
 * @alias Limiting
 * @param {Object} state - limiting properties
 * @returns {Limiting}
 */
function Limiting (state) {
    state = Object.assign({ count: Number.MAX_SAFE_INTEGER, offset: 0 }, state);

    return {
        /**
         * Retrieve the maximum size of the result set.
         * @function
         * @private
         * @name Limiting#getCount
         * @returns {number} The number of items.
         */
        getCount () {
            return state.count;
        },

        /**
         * Retrieve the number of items to skip on the result.
         * @function
         * @private
         * @name Limiting#getOffset
         * @returns {number} The number of items.
         */
        getOffset () {
            return state.offset;
        },

        /**
         * Add query limit count and offset.
         * @function
         * @name Limiting#limit
         * @param {Number} count - count of the result set
         * @param {Number} [offset] - number of records to skip
         * @throws {Error} When the limit count or offset are invalid.
         * @returns {Limiting} The query instance.
         */
        limit (count, offset) {
            const expectation = 'must be a non-negative integer';

            if (isNaN(parseInt(count, 10)) || count < 0) {
                throw new Error(`count ${expectation}`);
            }

            if ((typeof offset !== 'undefined' && isNaN(parseInt(offset, 10))) || offset < 0) {
                throw new Error(`offset ${expectation}`);
            }

            return this.setCount(count || state.count).setOffset(offset || state.offset);
        },

        /**
         * Set the maximum size of the result set.
         * @function
         * @private
         * @name Limiting#setCount
         * @param {number} count - number of items
         * @returns {Limiting} The query instance.
         */
        setCount (count) {
            state.count = count;

            return this;
        },

        /**
         * Set the number of items to skip on the result.
         * @function
         * @private
         * @name Limiting#setOffset
         * @param {number} offset - number of items
         * @returns {Limiting} The query instance.
         */
        setOffset (offset) {
            state.offset = offset;

            return this;
        }
    };
};

module.exports = Limiting;
