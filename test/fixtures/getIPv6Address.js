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

const dns = require('dns').promises;
const getIPv4Address = require('./getIPv4Address');

module.exports = function ({ host, port } = {}) {
    // The host can be a common name, IPv4 or IPv6 address.
    // "dns.lookup()"" does not work with IP addresses, so we first need to
    // ensure we use the resolved common name instead.
    // So, we can start by retrieving the IPv4 address.
    return getIPv4Address({ host })
        .then(address => {
            // Then we use the IPv4 address to obtain the common name.
            return dns.lookupService(address, port);
        })
        .then(({ hostname }) => {
            // We can then use the common name to finally obtain any available
            // IPv6 address. Of course, if the original host is already
            // provided as a common name, there is one extra step involved,
            // but, at least, we tried our best to obtain an address.
            return dns.lookup(hostname, { family: 6 });
        })
        .then(({ address }) => {
            return address;
        })
        // Ultimately, if the IPv6 address cannot be obtained, it should be
        // "undefined".
        .catch(() => undefined);
};
