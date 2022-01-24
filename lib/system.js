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

const os = require('os');

/**
 * Utilities for extracting system-wide details.
 * @private
 * @module System
 */

/**
 * Mapping of operating system names returned by the core Node.js API
 * and their corresponding commercial convention.
 * @private
 */
const BRAND_MAP = {
    freebsd: 'FreeBSD',
    linux: 'Linux',
    darwin: 'macOS',
    sunos: 'Solaris',
    win32: 'Windows'
};

/**
 * Mapping of processor architecture names returned by the core Node.js API
 * and their corresponding commercial convention.
 * @private
 */
const ARCHITECTURE_MAP = {
    arm: 'ARM',
    ia32: 'i386',
    x64: 'x86_64'
};

/**
 * Collection of functions to compute the commercialized version from the
 * values returned by the core Node.js API for each specific platform.
 * @private
 * @example
 * darwin@18.2.0 = macOS-10.14
 * sunos@5.11.4 = Solaris-11.4
 */
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
function version () {
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
 * Retrieve the operating system brand name and version.
 * @private
 * @returns {string}
 */
exports.brand = function () {
    const name = os.platform();

    let convention = BRAND_MAP[name];
    if (!convention) {
        convention = name;
    }

    convention += '-' + version();

    return convention;
};

/**
 * Retrieve the system hostname.
 * @private
 * @returns {string}
 */
exports.hostname = function () {
    return os.hostname();
};

/**
 * Retrieve the process id in the scope of the underlying system.
 * @private
 * @returns {string}
 */
exports.pid = function () {
    return process.pid.toString();
};

/**
 * Retrieve the platform name associated with the processor architecture.
 * @private
 * @returns {string}
 * @example
 * x86_64
 * i386
 * ARM
 */
exports.platform = function () {
    const base = os.arch();

    let convention = ARCHITECTURE_MAP[base];
    if (!convention) {
        convention = base;
    }

    return convention;
};

/**
 * Retrieve the current system time in milliseconds elapsed since the Unix
 * epoch.
 * @private
 * @returns {number}
 */
exports.time = function () {
    return Date.now();
};
