/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

'use strict';

const mandatory = [{
    priority: 1,
    name: 'ECDHE-ECDSA-AES128-GCM-SHA256'
}, {
    priority: 1,
    name: 'ECDHE-ECDSA-AES256-GCM-SHA384'
}, {
    priority: 1,
    name: 'ECDHE-RSA-AES128-GCM-SHA256'
}, {
    priority: 1,
    name: 'ECDHE-ECDSA-AES128-SHA256'
}, {
    priority: 1,
    name: 'ECDHE-RSA-AES128-SHA256'
}, {
    priority: 2,
    name: 'AES128-GCM-SHA256'
}, {
    priority: 2,
    name: 'AES256-GCM-SHA384'
}];

const approved = [{
    priority: 1,
    name: 'ECDHE-RSA-AES256-GCM-SHA384'
}, {
    priority: 1,
    name: 'ECDHE-ECDSA-AES256-SHA384'
}, {
    priority: 1,
    name: 'ECDHE-RSA-AES256-SHA384'
}, {
    priority: 1,
    name: 'DHE-RSA-AES128-GCM-SHA256'
}, {
    priority: 1,
    name: 'DHE-DSS-AES128-GCM-SHA256'
}, {
    priority: 1,
    name: 'DHE-RSA-AES128-SHA256'
}, {
    priority: 1,
    name: 'DHE-DSS-AES128-SHA256'
}, {
    priority: 1,
    name: 'DHE-DSS-AES256-GCM-SHA384'
}, {
    priority: 1,
    name: 'DHE-RSA-AES256-SHA256'
}, {
    priority: 1,
    name: 'DHE-DSS-AES256-SHA256'
}, {
    priority: 1,
    name: 'DHE-RSA-AES256-GCM-SHA384'
}, {
    priority: 1,
    name: 'ECDHE-RSA-AES128-SHA'
}, {
    priority: 1,
    name: 'ECDHE-ECDSA-AES128-SHA'
}, {
    priority: 1,
    name: 'ECDHE-RSA-AES256-SHA'
}, {
    priority: 1,
    name: 'ECDHE-ECDSA-AES256-SHA'
}, {
    priority: 1,
    name: 'DHE-DSS-AES128-SHA'
}, {
    priority: 1,
    name: 'DHE-RSA-AES128-SHA'
}, {
    priority: 1,
    name: 'DHE-DSS-AES256-SHA'
}, {
    priority: 1,
    name: 'DHE-RSA-AES256-SHA'
}, {
    priority: 2,
    name: 'DH-DSS-AES128-GCM-SHA256'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES128-GCM-SHA256'
}, {
    priority: 2,
    name: 'DH-DSS-AES256-GCM-SHA384'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES256-GCM-SHA384'
}, {
    priority: 2,
    name: 'AES128-SHA256'
}, {
    priority: 2,
    name: 'DH-DSS-AES128-SHA256'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES128-SHA256'
}, {
    priority: 2,
    name: 'AES256-SHA256'
}, {
    priority: 2,
    name: 'DH-DSS-AES256-SHA256'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES256-SHA384'
}, {
    priority: 2,
    name: 'AES128-SHA'
}, {
    priority: 2,
    name: 'DH-DSS-AES128-SHA'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES128-SHA'
}, {
    priority: 2,
    name: 'AES256-SHA'
}, {
    priority: 2,
    name: 'DH-DSS-AES256-SHA'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES256-SHA'
}, {
    priority: 2,
    name: 'DH-RSA-AES128-GCM-SHA256'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES128-GCM-SHA256'
}, {
    priority: 2,
    name: 'DH-RSA-AES256-GCM-SHA384'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES256-GCM-SHA384'
}, {
    priority: 2,
    name: 'DH-RSA-AES128-SHA256'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES128-SHA256'
}, {
    priority: 2,
    name: 'DH-RSA-AES256-SHA256'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES256-SHA384'
}, {
    priority: 2,
    name: 'ECDHE-RSA-AES128-SHA'
}, {
    priority: 2,
    name: 'ECDHE-ECDSA-AES128-SHA'
}, {
    priority: 2,
    name: 'ECDHE-RSA-AES256-SHA'
}, {
    priority: 2,
    name: 'ECDHE-ECDSA-AES256-SHA'
}, {
    priority: 2,
    name: 'DHE-DSS-AES128-SHA'
}, {
    priority: 2,
    name: 'DHE-RSA-AES128-SHA'
}, {
    priority: 2,
    name: 'DHE-DSS-AES256-SHA'
}, {
    priority: 2,
    name: 'DHE-RSA-AES256-SHA'
}, {
    priority: 2,
    name: 'AES128-SHA'
}, {
    priority: 2,
    name: 'DH-DSS-AES128-SHA'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES128-SHA'
}, {
    priority: 2,
    name: 'AES256-SHA'
}, {
    priority: 2,
    name: 'DH-DSS-AES256-SHA'
}, {
    priority: 2,
    name: 'ECDH-ECDSA-AES256-SHA'
}, {
    priority: 2,
    name: 'DH-RSA-AES128-SHA'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES128-SHA'
}, {
    priority: 2,
    name: 'DH-RSA-AES256-SHA'
}, {
    priority: 2,
    name: 'ECDH-RSA-AES256-SHA'
}, {
    priority: 2,
    name: 'CAMELLIA256-SHA'
}, {
    priority: 2,
    name: 'CAMELLIA128-SHA'
}, {
    priority: 2,
    name: 'DES-CBC3-SHA'
}];

const deprecated = [{
    priority: 3,
    name: 'DHE-DSS-DES-CBC3-SHA'
}, {
    priority: 3,
    name: 'DHE-RSA-DES-CBC3-SHA'
}, {
    priority: 3,
    name: 'ECDH-RSA-DES-CBC3-SHA'
}, {
    priority: 3,
    name: 'ECDH-ECDSA-DES-CBC3-SHA'
}, {
    priority: 3,
    name: 'ECDHE-RSA-DES-CBC3-SHA'
}, {
    priority: 3,
    name: 'ECDHE-ECDSA-DES-CBC3-SHA'
}];

const unacceptable = [{
    priority: 3,
    name: 'aNULL'
}, {
    priority: 3,
    name: 'eNULL'
}, {
    priority: 3,
    name: 'EXPORT'
}, {
    priority: 3,
    name: 'LOW'
}, {
    priority: 3,
    name: 'MD5'
}, {
    priority: 3,
    name: 'DES'
}, {
    priority: 3,
    name: 'RC2'
}, {
    priority: 3,
    name: 'RC4'
}, {
    priority: 3,
    name: 'PSK'
}
// FIXME(Rui): enable the exception as soon as the yaSSL cipher mismatch is resolved.
// , {
//     priority: 3,
//     name: 'SSLv3'
// }
];

module.exports = function () {
    const negate = cipher => ({ priority: cipher.priority, name: `!${cipher.name}` });

    return mandatory
        .concat(approved)
        .concat(deprecated.map(negate))
        .concat(unacceptable.map(negate))
        .sort((a, b) => a.priority - b.priority)
        .map(cipher => cipher.name)
        .join(':');
};
