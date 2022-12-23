/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const limiting = require('./Limiting');
const logger = require('../logger');
const warnings = require('../constants/warnings');

const log = logger('api');

/**
 * This mixin grants the capability of skipping a specific number of items
 * to a statement instance, when performing lookups, via composition.
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
         * Retrieves the number of items to skip on the result.
         * @function
         * @private
         * @name Skipping#getOffset_
         * @returns {number} The number of items.
         */
        getOffset_ () {
            return state.offset;
        },

        /**
         * Establishes the number of items to skip on when creating the
         * result set.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name Skipping#offset
         * @param {number} value - The number of items to skip in the result
         * set.
         * @returns {Skipping} The instance of the statement itself
         * following a fluent API convention.
         */
        offset (value) {
            this.resetStage();

            if (!isValidInteger(value) || value < 0) {
                throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_OFFSET_INPUT);
            }

            state.offset = value;

            return this;
        },

        /**
         * @function
         * @private
         * @name Skipping#setOffset
         * @param {number} value - The number of items to skip in the result
         * set.
         * @returns {Skipping} The instance of the statement itself
         * following a fluent API convention.
         * @deprecated since version 8.0.12. Will be removed in future versions.
         */
        setOffset (offset) {
            log.warning('setOffset', warnings.MESSAGES.WARN_DEPRECATED_SET_OFFSET, {
                type: warnings.TYPES.DEPRECATION,
                code: warnings.CODES.DEPRECATION
            });

            return this.offset(offset);
        }
    });
};

module.exports = Skipping;
