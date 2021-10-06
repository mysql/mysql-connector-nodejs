/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

const tls = require('tls');

/**
 * Lists all the allowed TLS versions
 * @private
 * @returns {string[]} Returns ['TLSv1.2', 'TLSv1.3']
 */
exports.allowed = function () {
    return ['TLSv1.2', 'TLSv1.3'];
};

/**
 * Retrieves the latest TLS version available for the Node.js engine (and
 * OpenSSL) version being used.
 * @private
 * @returns {string} Returns tls.DEFAULT_MAX_VERSION or 'TLSv1.2' if it is not
 * available.
 */
exports.latest = function () {
    return tls.DEFAULT_MAX_VERSION || 'TLSv1.2';
};

/**
 * Retrieves the list of TLS versions supported by the current Node.js
 * engine (and OpenSSL) version.
 * @private
 * @returns {string[]} Returns ['TLSv1.2'] on Node.js
 * versions below or equal to 10.x, and ['TLSv1.2', 'TLSv1.3'] on versions
 * above.
 */
exports.supported = function () {
    const allowed = this.allowed();
    const latest = this.latest();

    // If TLSv1.3 is supported, we should include it.
    return allowed.slice(0, allowed.indexOf(latest) > -1 ? allowed.indexOf(latest) + 1 : 0);
};

/**
 * Lists all the valid TLS versions that are not supported.
 * @private
 * @returns {string[]} Returns ['TLSv1', 'TLSv1.1']
 */
exports.unsupported = function () {
    return ['TLSv1', 'TLSv1.1'];
};
