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

const crypto = require('crypto');
const errors = require('./constants/errors');

/**
 * Utitlity wrapper for the core `crypto` module.
 * @private
 */

/**
 * Create an hash composed of a given set of values and options.
 * @private
 * @name module:crypto#createHash
 * @param {string[]} components - hash components
 * @param {Object} [options] - hash function options
 * @returns {Buffer} The resulting Node.js buffer.
 */
function createHash (components, options) {
    options = Object.assign({ algorithm: 'sha256' }, options);

    const hash = crypto.createHash(options.algorithm);
    components.forEach(component => hash.update(component));

    return hash.digest();
};

/**
 * Generate a SHA256 hash with an arbitrary number of parameters.
 * @function
 * @name module:crypto#sha256
 * @returns {Buffer} The resulting Node.js buffer.
 */
exports.sha256 = function () {
    return createHash(Array.prototype.slice.call(arguments));
};

/**
 * Generate a SHA1 hash with an arbitrary number of parameters.
 * @function
 * @name module:crypto#sha1
 * @returns {Buffer} The resulting Node.js buffer.
 */
exports.sha1 = function () {
    return createHash(Array.prototype.slice.call(arguments), { algorithm: 'sha1' });
};

/**
 * Apply a bitwise xor to the data of two buffers.
 * @function
 * @name module:crypto#xor
 * @param {Buffer} bufferA - a buffer
 * @param {Buffer} bufferB - a buffer
 * @returns {Buffer} The resulting Node.js buffer.
 */
exports.xor = function (bufferA, bufferB) {
    if (bufferA.length !== bufferB.length) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_AUTH_SCRAMBLE_BUFFER_SIZE);
    }

    // Since the entire buffer will be written, we should use
    // "Buffer.allocUnsafe()" instead of "Buffer.alloc()" because it is faster.
    // https://nodejs.org/docs/v14.0.0/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe
    const output = Buffer.allocUnsafe(bufferA.length);

    for (let i = 0; i < bufferA.length; ++i) {
        output[i] = bufferA[i] ^ bufferB[i];
    }

    return output;
};
