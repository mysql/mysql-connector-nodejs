/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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

const JSON = require('./json');
const util = require('util');
const warnings = require('./constants/warnings');

/**
 * Integrated client logger. Manages content to be displayed to an application
 * using different tools like the stdout/stderr stream and the debug log (with
 * NODE_DEBUG).
 * @private
 * @module Logger
 */

/**
 * Enum to identify logger levels.
 * @private
 * @readonly
 * @name LogLevel
 * @enum {string}
 */
const Level = {
    INFO: 'INFO',
    WARNING: 'WARNING'
};

/**
 * Append content to the debug log using a proper section to identify the
 * portion of the application that generates it.
 * @private
 * @param {Object} [options]
 * @param {string} [options.section] - content scope
 * @param {string} [options.component] - content generator
 * @param {string} [content] - log content
 * @param {LogLevel} [level] - log level
 */
function appendToDebugLog ({ section, component, content, level = Level.INFO }) {
    // Whilst stringifying a plain JavaScript object, BigInt values are
    // directly interpolated into the resulting string. So, no specific
    // configuration options are needed.
    return util.debuglog(`${section}.${component}`)(`[${level}] ${JSON().stringify(content, null, 2)}`);
}

/**
 * @private
 * @alias module:Logger
 * @param {string} section - log section
 * @returns {module:Logger}
 */
function Logger (section) {
    return {
        /**
         * Generate an informational message.
         * @private
         * @param {string} component - name of the component that is
         * generating the content
         * @param {string} content - content to be displayed
         */
        info (component, content) {
            // If the application did not enable the debug log, there is
            // nothing to do.
            if (!process.env.NODE_DEBUG) {
                return;
            }

            // If debug mode is enabled, we append the content to the debug
            // log.
            return appendToDebugLog({ section, component, content });
        },

        /**
         * Generate a warning message.
         * @private
         * @param {string} component - name of the component that is
         * generating the content
         * @param {string} content - content to be displayed
         * @param {object} options - extended options
         * @param {string} options.type - type of warning
         */
        warning (component, content, { type = warnings.TYPES.GENERIC, code = warnings.CODES.GENERIC } = {}) {
            // If the application did not enable the debug log, we use the
            // standard Node.js 'warning' event mechanism.
            // https://nodejs.org/docs/v14.0.0/api/process.html#process_event_warning
            if (!process.env.NODE_DEBUG) {
                return process.emitWarning(content, type, code);
            }

            // If debug mode is enabled, we append the content to the debug
            // log.
            return appendToDebugLog({ section, component, content, level: Level.WARNING });
        }
    };
}

Logger.Level = Level;

module.exports = Logger;
