/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const limiting = require('./Limiting');
const util = require('util');

/**
 * Skipping mixin.
 * @mixin
 * @alias Skipping
 * @mixes Limiting
 * @param {Object} state - Skipping properties
 * @returns {Skipping}
 */
function Skipping (state) {
    state = Object.assign({}, state);

    return Object.assign({}, limiting(state), {
        /**
         * Retrieve the number of items to skip on the result.
         * @function
         * @private
         * @name Skipping#getOffset
         * @returns {number} The number of items.
         */
        getOffset () {
            return state.offset;
        },

        /**
         * Set the number of items to skip on the result.
         * @function
         * @name Skipping#offset
         * @param {number} value - number of items
         * @returns {Skipping} The query instance.
         */
        offset (value) {
            this.resetStage();

            if (isNaN(parseInt(value, 10)) || value < 0) {
                throw new Error(`The offset value must be a non-negative integer.`);
            }

            state.offset = value;

            return this;
        },

        /**
         * @function
         * @private
         * @name Skipping#setOffset
         * @param {number} value - number of items
         * @returns {Skipping} The query instance.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         */
        setOffset: util.deprecate(function (offset) {
            return this.offset(offset);
        }, 'setOffset() is deprecated since version 8.0.12 and will be removed in future versions. Use offset() instead.')
    });
};

module.exports = Skipping;
