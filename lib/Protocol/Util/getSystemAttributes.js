/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const pkg = require('../../../package.json');
const os = require('os');

const OS_MAP = {
    freebsd: 'FreeBSD',
    linux: 'Linux',
    darwin: 'macOS',
    sunos: 'Solaris',
    win32: 'Windows'
};

const ARCH_MAP = {
    arm: 'ARM',
    ia32: 'i386',
    x64: 'x86_64'
};

const VERSION_MAP = {
    freebsd: v => v.match(/(\d+\.\d+).*/)[1],
    linux: v => v.match(/([^-]+).*/)[1],
    darwin: v => `10.${parseInt(v.match(/([^.]+).*/)[1], 10) - 4}`,
    sunos: v => v.match(/\d+\.([^-]+).*/)[1],
    win32: v => v.match(/([^-]+).*/)[1]
};

/**
 * Returns the version of the system running in the machine using a standard convention.
 * @private
 * @function
 * @returns {string} The platform name.
 */
function versionMask () {
    const name = os.platform();
    const version = os.release();

    if (VERSION_MAP[name]) {
        return VERSION_MAP[name](version);
    }

    let dashOffset = version.indexOf('-');
    if (dashOffset === -1) {
        dashOffset = version.length;
    }

    return version.substring(0, dashOffset);
}

/**
 * Returns the platform name of the system running in the machine using a standard convention.
 * @private
 * @function
 * @returns {string} The platform name.
 */
function osName () {
    const name = os.platform();

    let convention = OS_MAP[name];
    if (!convention) {
        convention = name;
    }

    convention += '-' + versionMask();

    return convention;
}

/**
 * Returns the architecture name of the system running in the machine using a standard convention.
 * @private
 * @function
 * @returns {string} The platform name.
 */
function platformName () {
    const base = os.arch();

    let convention = ARCH_MAP[base];
    if (!convention) {
        convention = base;
    }

    return convention;
}

/**
 * Returns the hostname associated to the machine.
 * @private
 * @function
 * @returns {string} The hostname of the machine.
 */
function sourceHostName () {
    return os.hostname();
}

/**
 * Returns the standard set of system attributes.
 * @private
 * @function
 * @name module:Scalar#encodeBytes
 * @param {Buffer} data - The binary data to encode
 * @returns {Uint8Array} The protobuf encoded binary payload.
 */
module.exports = function () {
    return {
        _pid: process.pid.toString(),
        _platform: platformName(),
        _os: osName(),
        _source_host: sourceHostName(),
        _client_name: 'mysql-connector-nodejs',
        _client_version: pkg.version,
        _client_license: pkg.license
    };
};
