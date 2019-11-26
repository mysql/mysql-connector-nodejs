/*
 * Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
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

/**
 * Security context utility suite.
 * @private
 * @module securityContext
 */

const ciphers = require('./ciphers');
const fs = require('../../../Adapters/fs');
const tls = require('tls');
const util = require('./util');

const ALLOWED_VERSIONS = ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'];
const LATEST_VERSION = tls.DEFAULT_MAX_VERSION || 'TLSv1.2';
// List of supported TLS versions for the current Node.js platform version.
const SUPPORTED_VERSIONS = ALLOWED_VERSIONS.slice(0, ALLOWED_VERSIONS.length - 1).concat(LATEST_VERSION === 'TLSv1.3' ? LATEST_VERSION : []);

/**
 * Generates a partial security context based on a valid certificate authority.
 * @function
 * @name module:securityContext#addCertificateAuthority
 * @param {String} filePath - the path of the CA file
 * @returns {Promise<Object>} A security context object compatible with the Node.js TLS socket API.
 */
exports.addCertificateAuthority = function (filePath) {
    return new Promise((resolve, reject) => {
        if (typeof filePath === 'undefined') {
            return resolve({});
        }

        if (typeof filePath !== 'string' || filePath.trim().length === 0) {
            return reject(new Error('The certificate authority (CA) file path is not valid.'));
        }

        // A CA file might contain a certificate chain/bundle.
        return fs.readFile(filePath, 'ascii')
            .then(bundle => resolve({ ca: util.parseX509Bundle(bundle), rejectUnauthorized: true }))
            .catch(reject);
    });
};

/**
 * Generates a partial security context based on a valid certificate revocation list.
 * @function
 * @name module:securityContext#addCertificateRevocationList
 * @param {String} filePath - the path of the CRL file
 * @returns {Promise<Object>} A security context object compatible with the Node.js TLS socket API.
 */
exports.addCertificateRevocationList = function (crlFilePath, caFilePath) {
    return new Promise((resolve, reject) => {
        // If the certificate authority is not available, the certificate revocation list has no meaning.
        if (typeof crlFilePath === 'undefined' || typeof caFilePath === 'undefined') {
            return resolve({});
        }

        if (typeof crlFilePath !== 'string' || crlFilePath.trim().length === 0) {
            return reject(new Error('The certificate revocation list (CRL) file path is not valid.'));
        }

        // A CRL does not contain a certificate chain/bundle.
        return fs.readFile(crlFilePath, 'ascii')
            .then(crl => resolve({ crl }))
            .catch(reject);
    });
};

/**
 * Generates a partial security context based on an a list of TLS versions.
 * @function
 * @name module:securityContext#addSecureProtocol
 * @param {String[]} [versions] - the list of TLS versions
 * @returns {Promise<Object>} A security context object compatible with the Node.js TLS socket API.
 */
exports.addSecureProtocol = function (versions) {
    return new Promise((resolve, reject) => {
        if (typeof versions !== 'undefined' && !Array.isArray(versions)) {
            return reject(new Error(`${JSON.stringify(versions)} is not a valid TLS protocol list format.`));
        }

        // we already know it is either an array or undefined
        const selected = Array.isArray(versions) ? versions : SUPPORTED_VERSIONS;
        const invalid = selected.filter(version => ALLOWED_VERSIONS.indexOf(version) === -1);

        if (invalid.length) {
            return reject(new Error(`"${invalid[0]}" is not a valid TLS protocol version. Should be one of ${ALLOWED_VERSIONS.join(', ')}.`));
        }

        const picks = SUPPORTED_VERSIONS.filter(version => selected.indexOf(version) > -1).sort();

        if ((Array.isArray(versions) && !versions.length) || !picks.length) {
            return reject(new Error('No supported TLS protocol version found in the provided list.'));
        }

        if (tls.DEFAULT_MIN_VERSION && tls.DEFAULT_MAX_VERSION) {
            // use new range-based API if available (Node.js >= 10.0.0)
            return resolve({ minVersion: picks[0], maxVersion: picks[picks.length - 1] });
        }

        // use strict protocol API on Node.js <= 10.0.0
        return resolve({ secureProtocol: picks[picks.length - 1].replace('.', '_').concat('_client_method') });
    });
};

/**
 * Generates a partial security context based on an a list of TLS IANA ciphersuites.
 * @function
 * @name module:securityContext#addCiphers
 * @param {String[]} [ciphersuites] - the list of IANA ciphersuite names
 * @returns {Promise<Object>} A security context object compatible with the Node.js TLS socket API.
 */
exports.addCiphers = function (ciphersuites) {
    return new Promise((resolve, reject) => {
        // the security context should contain a valid list of OpenSSL-supported cipher names, not simply IANA names.
        const picks = typeof ciphersuites === 'undefined' ? ciphers.defaults() : ciphers.overlaps(ciphersuites);

        if ((Array.isArray(ciphersuites) && !ciphersuites.length) || !picks.length) {
            return reject(new Error('No valid ciphersuite found in the provided list.'));
        }

        return resolve({ ciphers: picks.join(':') });
    });
};
