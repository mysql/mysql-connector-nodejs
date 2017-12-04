/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

/**
 * @module UUID
 * @private
 */

/**
 * Create a custom UUID generator inspired by RFC 4122 (https://www.ietf.org/rfc/rfc4122.txt).
 * @returns {string} A serializable hexadecimal string.
 * @example
 * const standardUUID = '5C99CDfE-48CB-11E6-94F3-4A383B7fCC8B'
 * const customUUID = '4A383B7FCC8B94F311E648CB5C99CDFE'
 */
function UUID () {
    const state = { node: node() };
    const systemClock = timestamp();

    return function () {
        state.clockSequence = state.clockSequence ? clockSequence(state.clockSequence) : clockSequence();
        state.timestamp = systemClock();

        return state.node
            .toString('hex')
            .concat(state.clockSequence.toString('hex'))
            .concat(state.timestamp.toString('hex'))
            .toUpperCase();
    };
}

/**
 * Generate an UUID v1 random 2-byte Node ID with a special bit.
 * @returns {Buffer} The resulting buffer.
 */
function node () {
    const noise = crypto.randomBytes(6);
    // Node IDs that don't identify the host must have the LSB of the first octet set to 1,
    // as specified by RFC 4122 - section 4.5.
    const randomnessOctet = 0b00000001;

    noise.writeUInt8(noise.readUInt8(0) | randomnessOctet, 0);

    return noise;
}

/**
 * Generate an UUID v1 2-byte clock sequence number.
 * @returns {Buffer} The resulting buffer.
 */
function clockSequence (previous) {
    let result;

    // If the previous value of the clock sequence is known, it can just be incremented; otherwise it
    // should be set to a random or high-quality pseudo-random value.
    if (!(previous instanceof Buffer)) {
        result = crypto.randomBytes(2);
    } else {
        const increment = parseInt(previous.toString('hex'), 16) + 1;
        /* eslint-disable node/no-deprecated-api */
        // result = new Buffer(increment.toString(16), 'hex');
        result = new Buffer(2);
        result.fill(0);
        /* eslint-enable node/no-deprecated-api */
        // Use network byte order (big endian) as recommended by RFC 4122.
        result.writeUInt16BE(increment, 0);
    }

    // The variant field consists of a variable number of the 3 most significant bits of octet 8
    // of the UUID, which refers to the first octet of the clock sequence component.
    // RFC 4122 specifies a standard variant of 0b100 or 0b101.
    result.writeUInt8((result.readUInt8(0) & 0b10111111) | 0b10000000, 0);

    return result;
}

/**
 * Generate an UUID v1 timestamp field.
 * @returns {Buffer} The resulting buffer.
 */
function timestamp () {
    let lastTick;
    let duplicates = 0;

    return function () {
        const gregorianReform = Date.UTC(1582, 9, 15);
        const diffInNanos = (Date.now() - gregorianReform) * 1000000;
        const tick = diffInNanos / 100;

        duplicates = tick !== lastTick ? 0 : duplicates + 1;
        lastTick = tick;

        /* eslint-disable node/no-deprecated-api */
        const timestamp = new Buffer(8);
        timestamp.fill(0);
        /* eslint-enable node/no-deprecated-api */

        // A high resolution timestamp can be simulated by keeping the count of the number of UUIDs that
        // have been generated with the same value of the system time, and using it to construct the low
        // order bits of the timestamp.
        const value = Number(tick + duplicates).toString(16);
        // Use network byte order (big endian) as recommended by RFC 4122.
        timestamp.writeUIntBE(parseInt(value.slice(0, 12), 16), 0, 6);
        timestamp.writeUInt16BE(parseInt(value.slice(12, value.length - 1), 16), 6, timestamp.length - 1);

        const timeLow = timestamp.slice(0, 4);
        const timeMid = timestamp.slice(4, 6);
        const timeHigh = timestamp.slice(6, 8);

        // The version number is in the most significant 4 bits of the timestamp and should be set to
        // 0b0001 (time-based v1) as specified by RCF 4122.
        timeHigh.writeUInt8((timeHigh.readUInt8(timeHigh.length - 1) & 0b11110000) | 0b00000001, timeHigh.length - 1);

        return Buffer.concat([timeHigh, timeMid, timeLow]);
    };
}

module.exports = UUID;
