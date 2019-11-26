/*
 * Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
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

/**
 * TLS utility suite.
 * @private
 * @module tls
 */

const context = require('./context');
const tls = require('tls');

/**
 * Creates a TLS socket with a specific security context.
 * @function
 * @name module:tls#createCustomSecurityContext
 * @param {Object} options - TLS configuration provided by the application
 * @returns {Promise<Object>} A security context object compatible with the Node.js TLS socket API.
 */
exports.createCustomSecurityContext = function (options) {
    const config = Object.assign({}, options, { rejectUnauthorized: false });

    const steps = [
        context.addCertificateAuthority(config.ca),
        context.addCertificateRevocationList(config.crl, config.ca),
        context.addSecureProtocol(config.versions),
        context.addCiphers(config.ciphersuites)
    ];

    return Promise.all(steps)
        .then(results => {
            const context = results.reduce((res, current) => Object.assign({}, res, current), config);
            delete context.versions;
            delete context.ciphersuites;

            return context;
        });
};

/**
 * Creates a TLS socket with a specific security context.
 * @function
 * @name module:tls#parseX509Bundle
 * @param {Object} context - the security context
 * @returns {Object} The Node.js TLS socket instance.
 */
exports.createSecureChannel = function (context) {
    return new Promise((resolve, reject) => {
        const socket = tls.connect(context);

        socket.on('secureConnect', () => {
            resolve(socket);
        });

        socket.on('error', error => {
            reject(error);
        });
    });
};
