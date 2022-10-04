/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const wraps = require('../Traits/Wraps');

/**
 * Wrapper for protobuf bytes values.
 * @private
 * @alias module:adapters.Protobuf.bytes
 * @param {Uint8Array} binary - the binary content
 * @returns {module:adapters.Protobuf.bytes}
 */
function bytes (typedArray) {
    return Object.assign({}, wraps(typedArray), {
        /**
         * Convert the underlying typed array to a Node.js Buffer instance
         * using shared memory space.
         * @function
         * @name module:adapters.Protobuf.bytes#toBuffer
         * @returns {Buffer}
         */
        toBuffer () {
            if (!(typedArray instanceof Uint8Array)) {
                return Buffer.alloc(0);
            }

            // We should provide the byte offset and length in order to create
            // a view of the shared ArrayBuffer and avoid creating a new copy.
            return Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        },

        /**
         * Serialize to JSON.
         * @function
         * @name module:adapters.Protobuf.bytes#toBuffer
         * @returns {Buffer}
         */
        toJSON () {
            return this.toBuffer().toJSON();
        },

        /**
         * Decode the underlying binary data to a string of a specific encoding.
         * @function
         * @name module:adapters.Protobuf.bytes#toString
         * @param {string} [encoding] - utf8 by default
         * @returns {string}
         */
        toString (encoding) {
            return this.toBuffer().toString(encoding);
        }
    });
}

/**
 * Create a protobuf bytes wrapper representation.
 * @param {Buffer} buffer
 * @returns {module:adapters.Protobuf.bytes}
 */
bytes.create = function (buffer) {
    if (!(buffer instanceof Buffer)) {
        return bytes(new Uint8Array());
    }

    // We should use the Uint8Array constructor with the buffer data, byte
    // offset and length in order to create a view of the shared ArrayBuffer
    // and avoid creating a new copy.
    return bytes(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Uint8Array.BYTES_PER_ELEMENT));
};

/**
 * Deserialize raw data from the network.
 * @param {Buffer} buffer - the raw data
 * @returns {Uint8Array}
 */
bytes.deserialize = function (buffer) {
    return this.create(buffer).valueOf();
};

module.exports = bytes;
