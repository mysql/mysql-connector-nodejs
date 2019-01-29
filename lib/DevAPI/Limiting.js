/*
 * Copyright (c) 2017, 2018, Oracle and/or its affiliates. All rights reserved.
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

const deprecated = require('./Util/deprecated');
const preparing = require('./Preparing');
const util = require('util');

/**
 * Enum the current statement lifecycle stage.
 * @readonly
 * @private
 * @name PREPARE_OPTIONS
 * @enum {number}
 */
const PREPARE_OPTIONS = {
    TO_PREPARE: 1,
    TO_NOT_PREPARE: 2
};

/**
 * Limiting mixin.
 * @mixin
 * @alias Limiting
 * @param {Object} state - limiting properties
 * @returns {Limiting}
 */
function Limiting (state) {
    state = Object.assign({ stage: PREPARE_OPTIONS.TO_PREPARE, preparable: preparing(), allowsOffset: false }, state);

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
            if (state.stage === PREPARE_OPTIONS.TO_PREPARE) {
                state.preparable.forceReprepare();
                state.stage = PREPARE_OPTIONS.TO_NOT_PREPARE;
            }

            if (arguments[1]) {
                deprecated('Passing an offset to limit() is a deprecated behavior since version 8.0.12 and will not be available in future versions. Use offset() instead.');
            }

            if (isNaN(parseInt(count, 10)) || count < 0) {
                throw new Error('The count value must be a non-negative integer.');
            }

            state.count = count;

            if (!state.allowsOffset) {
                return this;
            }

            // TODO(Rui): update after deprecation period
            // Adding a value for LIMIT should force a default OFFSET=0 to streamline prepared statement support.
            if (!offset) {
                return this.offset(state.offset || 0);
            }

            return this.offset(offset);
        },

        /**
         * Set the number of items to skip on the result.
         * @function
         * @name Limiting#offset
         * @param {number} value - number of items
         * @returns {Limiting} The query instance.
         */
        offset (value) {
            if (state.stage === PREPARE_OPTIONS.TO_PREPARE) {
                state.preparable.forceReprepare();
                state.stage = PREPARE_OPTIONS.TO_NOT_PREPARE;
            }

            if (isNaN(parseInt(value, 10)) || value < 0) {
                throw new Error(`The offset value must be a non-negative integer.`);
            }

            state.offset = value;

            return this;
        },

        /**
         * @function
         * @private
         * @name Limiting#setCount
         * @param {number} value - number of items
         * @returns {Limiting} The query instance.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         */
        setCount: util.deprecate(function (count) {
            state.count = count;

            return this;
        }, 'setCount() is deprecated since version 8.0.12 and will be removed in future versions. Use limit() instead.'),

        /**
         * @function
         * @private
         * @name Limiting#setOffset
         * @param {number} value - number of items
         * @returns {Limiting} The query instance.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         */
        setOffset: util.deprecate(function (offset) {
            return this.offset(offset);
        }, 'setOffset() is deprecated since version 8.0.12 and will be removed in future versions. Use offset() instead.')
    };
};

module.exports = Limiting;
