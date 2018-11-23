/*
 * Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.
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

const authPlugin = require('./AuthPlugin');
const sha1 = require('./Util/crypto').sha1;
const xor = require('./Util/crypto').xor;

const Name = 'MYSQL41';

/**
 * MySQL41Auth factory.
 * @private
 * @alias MySQL41Auth
 * @param {Object} state - plugin properties
 * @returns {MySQL41Auth} A plugin instance.
 */
function MySQL41Auth (state) {
    state = Object.assign({ algorithm: 'sha1', hashSize: 20, nonceSize: 20 }, state);

    const api = Object.assign({}, authPlugin(state), {
        /**
         * Generate the payload for the first authentication step.
         * @function
         * @name module:MySQL41Auth#getInitialAuthData
         * @returns {undefined}
         */
        getInitialAuthData () {},

        /**
         * Retrieve the name of the authentication mechanism (client plugin).
         * @function
         * @name module:MySQL41Auth#getName
         * @returns {string} 'MYSQL41'
         */
        getName () {
            return Name;
        },

        /**
         * Generate the payload for the second authentication step.
         * @function
         * @name module:MySQL41Auth#getNextAuthData
         * @param {Buffer} nonce - nonce returned by the server in the first step
         * @returns {Buffer} A Node.js buffer with a hexadecimal value in the format of "[SCHEMA]\0USER\0*[SCRAMBLE]\0".
         */
        getNextAuthData (nonce) {
            if (nonce.length !== state.nonceSize) {
                throw new Error(`Invalid nonce length - expected ${state.nonceSize} bytes, got ${nonce.length}.`);
            }

            const schema = this.getSchema();
            const user = this.getUser();
            const password = this.getPassword();
            // if the password is not empty, since the hash is an hexadecimal string,
            // we should accomodate enough space for each character
            const size = !password ? schema.length + user.length + 2 : schema.length + user.length + state.hashSize * 2 + 3;

            /* eslint-disable node/no-deprecated-api */
            const authData = new Buffer(size);
            /* eslint-enable node/no-deprecated-api */

            authData.fill(0);
            authData.write(schema);
            authData.write(user, schema.length + 1);
            authData.write('*', schema.length + user.length + 2);

            if (!password) {
                // authData="[SCHEMA]\0USER\0*\0"
                return authData;
            }

            // authData = "[SCHEMA]\0USER\0*SCRAMBLE\0"
            const scramble = xor(sha1(password), sha1(nonce, sha1(sha1(password))));
            authData.write(scramble.toString('hex'), schema.length + user.length + 3);

            return authData;
        }
    });

    if (!api.getUser()) {
        throw new Error(`The user name is required for ${api.getName()}. Set a value for the "user" property.`);
    }

    return api;
}

MySQL41Auth.Name = Name;

module.exports = MySQL41Auth;
