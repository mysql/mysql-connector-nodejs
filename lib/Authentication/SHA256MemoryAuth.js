/*
 * Copyright (c) 2018, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const authPlugin = require('./AuthPlugin');
const errors = require('../constants/errors');
const util = require('util');
const { sha256, xor } = require('../crypto');

const Name = 'SHA256_MEMORY';

/**
 * SHA256MemoryAuth factory.
 * @private
 * @alias SHA256MemoryAuth
 * @param {Object} state - plugin properties
 * @returns {SHA256MemoryAuth} A plugin instance.
 */
function SHA256MemoryAuth (state) {
    state = Object.assign({ algorithm: 'sha256', hashSize: 32, nonceSize: 20 }, state);

    return Object.assign({}, authPlugin(state), {
        /**
         * Generate the payload for the first authentication step.
         * @function
         * @name module:SHA256MemoryAuth#getInitialAuthData
         * @returns {undefined}
         */
        getInitialAuthData () {},

        /**
         * Retrieve the name of the authentication mechanism (client plugin).
         * @function
         * @name module:SHA256MemoryAuth#getName
         * @returns {string} 'SHA256_MEMORY'
         */
        getName () {
            return Name;
        },

        /**
         * Generate the payload for the second authentication step.
         * @function
         * @name module:SHA256MemoryAuth#getNextAuthData
         * @param {Buffer} nonce - nonce returned by the server in the first step
         * @returns {Buffer} A Node.js buffer with a hexadecimal value in the format of "[SCHEMA]\0USER\0SCRAMBLE".
         */
        getNextAuthData (nonce) {
            if (nonce.length !== state.nonceSize) {
                throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_NONCE_MISMATCH, state.nonceSize, nonce.length));
            }

            const schema = this.getSchema();
            const user = this.getUser();
            const password = this.getPassword();
            // it does not matter if the password is empty or not, since the hash is an hexadecimal string,
            // we should accomodate enough space for each character (even for "zeroed" bytes, since the
            // scramble is mandatory)
            const size = schema.length + user.length + state.hashSize * 2 + 3;

            // We want the buffer to be zero-filled by default, so we should
            // use Buffer.alloc().
            const authData = Buffer.alloc(size);
            authData.write(schema);
            authData.write(user, schema.length + 1);

            // authData = "[SCHEMA]\0USER\0SCRAMBLE"
            const scramble = xor(sha256(sha256(sha256(password)), nonce), sha256(password));
            authData.write(scramble.toString('hex'), schema.length + user.length + 2);

            return authData;
        }
    });
}

SHA256MemoryAuth.Name = Name;

module.exports = SHA256MemoryAuth;
