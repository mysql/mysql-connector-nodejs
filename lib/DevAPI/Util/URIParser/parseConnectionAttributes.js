/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
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

const errors = require('../../../constants/errors');
const parseQueryParameters = require('./parseQueryParameters');
const qs = require('querystring');

module.exports = parse;

function parse (input) {
    const match = (input || '').trim().match(/^\?([^#]+)/) || [];
    const params = parseQueryParameters(match[1], { allowDuplicates: false, ignoreCase: ['connection-attributes'], pctEncoded: true });

    const attributes = params['connection-attributes'];

    if (!attributes || attributes === 'true') {
        return {};
    }

    if (attributes === 'false') {
        return false;
    }

    const isArray = attributes.charAt(0) === '[' && attributes.charAt(attributes.length - 1) === ']';

    if (!isArray) {
        return attributes;
    }

    const obj = qs.parse(attributes.slice(1, attributes.length - 1), ',', '=', { decodeURIComponent: s => qs.unescape(s.trim()) });

    const duplicates = Object.keys(obj).filter(k => Array.isArray(obj[k]));

    if (!duplicates.length) {
        return obj;
    }

    throw new Error(errors.MESSAGES.ER_DEVAPI_DUPLICATE_SESSION_ATTRIBUTE);
}
