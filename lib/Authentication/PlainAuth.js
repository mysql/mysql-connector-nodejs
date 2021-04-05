/*
 * Copyright (c) 2015, 2021, Oracle and/or its affiliates.
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
const errors = require('../constants/errors');
const util = require('util');

const Name = 'PLAIN';

function PlainAuth (state) {
    return Object.assign({}, authPlugin(state), {
        /**
         * Generate the payload for the first authentication step.
         * @function
         * @name module:PlainAuth#getInitialAuthData
         * @returns {Buffer} A Node.js buffer with a hexadecimal value in the format of "[SCHEMA]\0USER\0[PASSWORD]".
         */
        getInitialAuthData () {
            const schema = this.getSchema();
            const user = this.getUser();
            const password = this.getPassword();

            // We want the buffer to be zero-filled by default, so we should
            // use Buffer.alloc().
            const authData = Buffer.alloc(schema.length + user.length + password.length + 2);
            authData.write(schema);
            authData.write(user, schema.length + 1);
            authData.write(password, schema.length + user.length + 2);

            return authData;
        },

        /**
         * Retrieve the name of the authentication mechanism (client plugin).
         * @function
         * @name module:PlainAuth#getName
         * @returns {string} 'PLAIN'
         */
        getName () {
            return Name;
        },

        /**
         * Generate the payload for the second authentication step.
         * @function
         * @name module:PlainAuth#getNextAuthData
         * @throws {Error} Will throw a error if called, since it should not be used.
         */
        getNextAuthData () {
            throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNEXPECTED_STEP, this.getName()));
        }
    });
}

PlainAuth.Name = Name;

module.exports = PlainAuth;
