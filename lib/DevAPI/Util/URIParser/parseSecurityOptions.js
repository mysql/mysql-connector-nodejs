/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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
const logger = require('../../../logger');
const parseQueryParameters = require('./parseQueryParameters');
const util = require('util');
const warnings = require('../../../constants/warnings');

const log = logger('parser:uri:tls');

module.exports = parse;

function parseItemList (input) {
    if (input === '[]') {
        return [];
    }

    const match = (input || '[]').match(/^\[([^\]]*)\]$/);
    const list = !match ? [] : match[1];

    if (!list.length) {
        return undefined;
    }

    return list.split(',');
}

/**
 * Parse SSL/TLS options.
 * @private
 * @param {string} input - URI querystring
 * @returns {Object} Security section dictionary for URI properties object.
 */
function parse (input = '') {
    const match = input.trim().match(/^\?([^#]+)/) || [];
    const params = parseQueryParameters(match[1], { allowDuplicates: true, ignoreCase: ['ssl-mode'] });

    const isSecure = params['ssl-mode'] !== 'disabled';
    const options = Object.assign({}, params, { 'ssl-enabled': isSecure });

    const versions = parseItemList(params['tls-versions']);
    const ciphersuites = parseItemList(params['tls-ciphersuites']);

    if (versions) {
        options['tls-versions'] = versions;
    }

    if (ciphersuites) {
        options['tls-ciphersuites'] = ciphersuites;
    }

    delete options['ssl-mode'];

    const tlsOptions = Object.keys(options).reduce((result, key) => {
        const match = key.trim().match(/^ssl-(.+)$/) || key.trim().match(/^tls-(.+)$/) || [];

        return !match[1] ? result : Object.assign(result, { [match[1]]: options[key] });
    }, {});

    // If "ssl-mode" is "VERIFY_CA" or "VERIFY_IDENTITY", the path to the
    // certificate authority PEM file MUST be provided.
    if ((params['ssl-mode'] === 'verify_ca' || params['ssl-mode'] === 'verify_identity') && typeof tlsOptions.ca === 'undefined') {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_CERTIFICATE_AUTHORITY_REQUIRED, params['ssl-mode'].toUpperCase()));
    }

    // If "ssl-mode" is neither "VERIFY_CA" nor "VERIFY_IDENTITY", any path
    // provided for the certificate authority PEM file or the certificate
    // revocation list PEM file should be ignored.
    // Previously, this behaviour was a bit more strict, so we should ensure
    // the user sees a warning.
    if (params['ssl-mode'] !== 'verify_ca' && params['ssl-mode'] !== 'verify_identity') {
        if (typeof params['ssl-ca'] !== 'undefined') {
            log.warning('ssl-ca', warnings.MESSAGES.WARN_STRICT_CERTIFICATE_VALIDATION);
        }

        delete tlsOptions.ca;
        delete tlsOptions.crl;
    }

    if (params['ssl-mode'] === 'verify_identity') {
        tlsOptions.checkServerIdentity = true;
    }

    return tlsOptions;
}
