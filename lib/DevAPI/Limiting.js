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

const { isValidInteger } = require('../validator');
const errors = require('../constants/errors');
const logger = require('../logger');
const preparing = require('./Preparing');
const warnings = require('../constants/warnings');

const log = logger('api');

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
 * This mixin grants the capability of limiting the result set of a statement
 * to a given number of items, via composition.
 * @mixin
 * @alias Limiting
 * @param {Object} state - limiting properties
 * @returns {Limiting}
 */
function Limiting (state) {
    state = Object.assign({ stage: PREPARE_OPTIONS.TO_PREPARE, preparable: preparing() }, state);

    return {
        /**
         * Retrieves the maximum size of the result set.
         * @function
         * @private
         * @name Limiting#getCount_
         * @returns {number} The number of items.
         */
        getCount_ () {
            return state.count;
        },

        /**
         * Defines the maximum number of items in the result set.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Limiting#limit
         * @param {Number} count - The maximum size of the result set.
         * @throws Value is not a positive integer.
         * @returns {Limiting} The instance of the statement itself
         * following a fluent API convention.
         */
        limit (count, offset) {
            this.resetStage();

            // The offset should be defined using the Skipping.offset()
            // method. Although it still works, defining the offset in the
            // call to Limiting.limit() is deprecated.
            if (arguments[1]) {
                log.warning('limit', warnings.MESSAGES.WARN_DEPRECATED_LIMIT_WITH_OFFSET, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });
            }

            if (!isValidInteger(count) || count < 0) {
                throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_LIMIT_INPUT);
            }

            state.count = count;

            if (typeof this.offset !== 'function') {
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
         * @function
         * @private
         * @name Limiting#resetStage
         * @returns {Limiting} The instance of the statement itself
         * following a fluent API convention.
         */
        resetStage () {
            if (state.stage !== PREPARE_OPTIONS.TO_PREPARE) {
                return;
            }

            state.preparable.forceReprepare();
            state.stage = PREPARE_OPTIONS.TO_NOT_PREPARE;

            return this;
        },

        /**
         * @function
         * @private
         * @name Limiting#setCount
         * @param {number} value - The number of items.
         * @returns {Limiting} The instance of the statement itself
         * following a fluent API convention.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         */
        setCount (count) {
            log.warning('setCount', warnings.MESSAGES.WARN_DEPRECATED_LIMIT_SET_COUNT, {
                type: warnings.TYPES.DEPRECATION,
                code: warnings.CODES.DEPRECATION
            });

            state.count = count;

            return this;
        }
    };
};

Limiting.PREPARE_OPTIONS = PREPARE_OPTIONS;

module.exports = Limiting;
