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
 * TLS ciphers utility suite.
 * @private
 * @module ciphers
 */

const ciphers = require('./OSSA_CRB_TLSCiphersuites.json');

/**
 * Ciphers required by older MySQL server versions based on WolfSSL/YaSSL.
 */
const COMPATIBILITY_CIPHERS = [
    'TLS_DHE_RSA_WITH_AES_256_CBC_SHA',
    'TLS_DHE_RSA_WITH_AES_128_CBC_SHA',
    'TLS_RSA_WITH_AES_256_CBC_SHA'
];

/**
 * Creates a list of OpenSSL cipher names matching the provided IANA ciphers names in the OSSA list.
 * @function
 * @name module:ciphers#overlaps
 * @param {Array<String>} ciphersuites - The list of IANA cipher names
 * @returns {Array<String>} The list of OpenSSL cipher names.
 */
exports.overlaps = function (ciphersuites) {
    return ciphers.mandatory_tls_ciphersuites.concat(ciphers.approved_tls_ciphersuites)
        .concat(ciphers.deprecated_tls_ciphersuites)
        .filter(cipher => (ciphersuites || []).indexOf(cipher.iana_cipher_name) > -1)
        .map(cipher => cipher.openssl_cipher_name);
};

/**
 * Creates the default list of OpenSSL cipher names that are available in the OSSA list.
 * @function
 * @name module:ciphers#defaults
 * @returns {Array<String>} The list of OpenSSL cipher names.
 */
exports.defaults = function () {
    return ciphers.mandatory_tls_ciphersuites.concat(ciphers.approved_tls_ciphersuites)
        .map(cipher => cipher.openssl_cipher_name)
        .concat(this.overlaps(COMPATIBILITY_CIPHERS));
};
