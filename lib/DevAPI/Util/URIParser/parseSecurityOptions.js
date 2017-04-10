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

const parseQueryParameters = require('./parseQueryParameters');

module.exports = parse;

/**
 * Parse SSL/TLS options.
 * @private
 * @param {string} input - URI querystring
 * @returns {Object} Security section dictionary for URI properties object.
 */
function parse (input) {
    // TODO(Rui): use default agument values on node >= 6.0.0
    const match = (input || '').trim().match(/^\?([^#]+)/) || [];
    const params = parseQueryParameters(match[1], { allowDuplicates: false, ignoreCase: ['ssl-mode'] });

    const isSecure = params['ssl-mode'] !== 'disabled';
    const hasValidation = ['ssl-ca', 'ssl-crl'].filter(p => Object.keys(params).indexOf(p) > -1).length > 0;

    if (!isSecure && hasValidation) {
        throw new Error('Inconsistent security options');
    }

    const options = Object.assign({}, params, { 'ssl-enable': isSecure });
    delete options['ssl-mode'];

    return Object.keys(options).reduce((result, key) => {
        const match = key.trim().match(/^ssl-(.+)$/) || [];

        return !match[1] ? result : Object.assign(result, { [match[1]]: options[key] });
    }, {});
}
