/*
 * Copyright (c) 2017, 2019, Oracle and/or its affiliates. All rights reserved.
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

// TODO(Rui): Add additional query validation constraints.
module.exports = parse;

/**
 * Parse all querystring parameters.
 * @private
 * @param {string} input - URI querystring
 * @param {options} [options]
 * @returns {Object} Dictionary containing each querystring property and respective value.
 */
function parse (input, options) {
    options = Object.assign({ allowDuplicates: true, ignoreCase: [] }, options);

    // TODO(Rui): use default agument values on node >= 6.0.0
    const match = (input || '').trim().match(/[^&]+/g) || [];

    return match.reduce((result, input) => {
        // const pair = parseKeyValuePair(input, { ignoreCase: options.ignoreCase });
        const pair = parseKeyValuePair(input, options);
        const isDuplicate = Object.keys(result).indexOf(Object.keys(pair)[0]) > -1;

        if (isDuplicate && !options.allowDuplicates) {
            throw new Error('Duplicate options');
        }

        return Object.assign(result, pair);
    }, {});
}

/**
 * Parse individual parameters.
 * @private
 * @param {string} input - querystring assignment
 * @param {Object} [options]
 */
function parseKeyValuePair (input, options) {
    options = Object.assign({ ignoreCase: [] }, options);

    const match = input.trim().match(/^([^=]+)(=(.*))?$/);
    const key = (match[1] || '').toLowerCase();
    const value = match[3] || '';

    const toIgnore = options.ignoreCase.map(key => key.toLowerCase());

    if (toIgnore.indexOf(key) === -1) {
        return { [key]: decode(value, options) };
    }

    return { [key]: decode(value.toLowerCase(), options) };
}

/**
 * Decode url-encoded values.
 * @private
 */
function decode (input, options) {
    options = Object.assign({ pctEncoded: false }, options);

    if (options.pctEncoded) {
        return decodeURIComponent(input);
    }

    const match = (input || '').trim().match(/\(?([^)]*)/);

    return decodeURIComponent(match[1]);
}
