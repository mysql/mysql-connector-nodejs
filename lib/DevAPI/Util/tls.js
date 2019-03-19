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

/**
 * TLS object definition.
 * @typedef {Object} TLSOptions
 * @property {String} [ca] - path to a certificate authority PEM file
 * @property {String} [crl] - path to a certificate revocation list PEM file
 * @property {Array<String>} [versions] - list of TLS versions to allow, 'TLSv1', 'TLSv1.1', 'TLSv1.2' and 'TLSv1.3' (Node.js >= 12.0.0 only).
 */

const deprecated = require('./deprecated');

exports.validateOptions = function (options) {
    options = Object.assign({}, options, { tls: options.tls || options.sslOptions || {} });

    if (options.sslOptions) {
        deprecated('The "sslOptions" property is deprecated since 8.0.19 and will be removed in future versions. Use "tls" instead.');
    }

    const hasSingleSocket = typeof options.socket === 'string';
    const hasFailoverSocket = options.endpoints && options.endpoints[0] && typeof options.endpoints[0].socket === 'string';

    if (hasSingleSocket || hasFailoverSocket) {
        // TLS should be disabled if the connection will use a unix socket.
        return { enabled: false };
    }

    const isTLSOptionEnabled = options.tls.enabled === true;
    const isTLSOptionUndefined = typeof options.tls.enabled === 'undefined';
    const isSSLOptionEnabled = options.ssl === true;
    const isSSLOptionUndefined = typeof options.ssl === 'undefined';

    const hasAdditionalOptions = Object.keys(options.tls)
        .filter(key => key !== 'enabled')
        .some(key => typeof options.tls[key] !== 'undefined');

    const shouldEnableTLS = (isTLSOptionUndefined && isSSLOptionUndefined) || (isTLSOptionEnabled || isSSLOptionEnabled);

    if (!shouldEnableTLS && hasAdditionalOptions) {
        throw new Error('Additional TLS options cannot be specified when TLS is disabled.');
    }

    if (!shouldEnableTLS) {
        return { enabled: false };
    }

    return Object.assign({}, options.tls, { enabled: true });
};
