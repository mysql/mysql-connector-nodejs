/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
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

const dns = require('../../Adapters/dns');

exports.getSortedAddressList = function (host) {
    return dns.resolveSrv(host)
        .then(addresses => Array.from(addresses).sort((a, b) => {
            if (a.priority < b.priority) {
                return -1;
            }

            if (a.priority > b.priority) {
                return 1;
            }

            if (a.weight > b.weight) {
                return -1;
            }

            if (a.weight < b.weight) {
                return 1;
            }

            return 0;
        }))
        .catch(() => {
            throw new Error(`Unable to locate any hosts for ${host}`);
        });
};

exports.validateOptions = function (options) {
    if (typeof options.resolveSrv !== 'undefined' && typeof options.resolveSrv !== 'boolean') {
        throw new Error('SRV resolution can only be toggled using a boolean value (true or false).');
    }

    if (options.resolveSrv && options.endpoints && options.endpoints.length > 1) {
        throw new Error('Specifying multiple hostnames with DNS SRV lookup is not allowed.');
    }

    if (options.resolveSrv && ((options.endpoints && options.endpoints.some(e => !!e.socket)) || options.socket)) {
        throw new Error('Using Unix domain sockets with DNS SRV lookup is not allowed.');
    }

    if (options.resolveSrv && ((options.endpoints && options.endpoints.some(e => !!e.port)) || options.port)) {
        throw new Error('Specifying a port number with DNS SRV lookup is not allowed.');
    }
};
