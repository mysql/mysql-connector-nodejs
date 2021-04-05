/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

const errors = require('../constants/errors');
const fs = require('fs');
const tls = require('tls');
const tlsCiphers = require('./ciphers');
const tlsVersions = require('./versions');
const util = require('util');
const { isValidArray, isValidString } = require('../validator');

/**
 * Create a valid security context compatible with the Node.js TLS socket API
 * https://nodejs.org/docs/v12.0.0/api/tls.html#tls_tls_createsecurecontext_options
 * @private
 * @param {Object} options - TLS options provided by the application
 * @returns {Object} An object containing the appriate TLS socket configuration
 * options.
 */
exports.create = function (options = {}) {
    // If the application does not provide a list of allowed TLS versions,
    // we use our own. We cannot have a default list of ciphersuites because
    // those are dependent on the TLS version that ends up being used.
    options = Object.assign({}, { versions: tlsVersions.allowed(), ciphersuites: [] }, options);
    // We need to create the proper securiy context containing any
    // certificates, TLS versions or ciphersuites that have been provided.
    // Applications can also provide any additional option supported by the
    // Node.js security context.
    // https://nodejs.org/docs/v12.0.0/api/tls.html#tls_tls_createsecurecontext_options
    const context = Object.assign({}, {
        // Unless a certificate authority is provided, all connections should
        // be authorized.
        rejectUnauthorized: false
    }, options);
    // The list of allowed TLS versions can be less strict than the list of
    // TLS versions that are actually supported by the Node.js engine and
    // OpenSSL versions. Thus, we need to filter them, and sort them from the
    // oldest to the latest.
    const versions = tlsVersions.supported().filter(v => options.versions.indexOf(v) > -1).sort();

    // If a list of ciphersuites is not provided, we want to use the
    // default set of ciphershuites, otherwise we want only those
    // that are effectively supported.
    const ciphersuites = !options.ciphersuites.length ? tlsCiphers.defaults() : tlsCiphers.overlaps(options.ciphersuites);

    // The ciphersuites variable contains a list of ciphersuites that need to
    // be converted to the OpenSSL format (colon-separated).
    context.ciphers = ciphersuites.join(':');

    // We also already have a valid list of TLS versions. If the Node.js core
    // API supports a TLS version range, we should use it and set the minimum
    // and maximum version supported. If TLSv1.3 is not supported, maxVersion
    // will be TLSv1.2.
    if (tls.DEFAULT_MIN_VERSION && tls.DEFAULT_MAX_VERSION) {
        context.minVersion = versions[0];
        context.maxVersion = versions[versions.length - 1];
    } else {
        // Otherwise, for older Node.js engine versions (with an older OpenSSL
        // version) we need to specify the best option which, in the best case
        // scenario, will be TLSv1.2, since TLSv1.3 is never supported for
        // these Node.js versions.
        context.secureProtocol = versions[versions.length - 1].replace('.', '_').concat('_client_method');
    }

    // If there is a path to a CA file, we should use it.
    if (options.ca) {
        // When we provide a CA file, we want the server certificate to be
        // verified against the chain of certificate authorities defined by
        // the file, and throw an error if the verification fails.
        context.rejectUnauthorized = true;
        context.ca = fs.readFileSync(options.ca);
    }

    // If there is a path to a CRL file, we should use it.
    if (options.crl) {
        context.crl = fs.readFileSync(options.crl);
    }

    return context;
};

/**
 * Validate the TLS options.
 * @private
 * @param {Object} params
 * @param {TLS} [params.tls] - wether TLS should be enabled or disabled
 * @param {boolean} [params.ssl] - deprecated property to enable or disable TLS
 * @param {DeprecatedSSLOptions} [params.sslOptions] - deprecated property to provide additional TLS options
 * @returns {boolean} Returns true all properties and values are valid.
 * @throws when TLS should be disabled and additional properties are provided,
 * when any path to a certificate authority or certificate revocation file is
 * not a valid string, when the list of TLS versions does not include any valid
 * one, or contains one that is not supported, or when the list of ciphersuites
 * does not include any valid one
 */
exports.validate = function ({ tls, ssl, sslOptions }) {
    const tlsIsDisabled = (tls && tls.enabled === false) || ssl === false;
    const tlsOptions = Object.assign({}, tls, sslOptions);
    // If TLS is disabled, we should not allow any additional options.
    if (tlsIsDisabled === true && Object.keys(tlsOptions).some(k => k !== 'enabled')) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TLS_OPTIONS);
    }

    const localFilePattern = "^.{0,2}/[a-zA-Z0-9-._~!$&'()*+,;=]+";

    // Validate any CA file path.
    if (!isValidString({ value: tlsOptions.ca, pattern: localFilePattern })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH);
    }

    // Validate any CRL file path.
    if (!isValidString({ value: tlsOptions.crl, pattern: localFilePattern })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH);
    }

    // Check if TLS versions are provided in a valid list-like format.
    if (!isValidArray({ value: tlsOptions.versions })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, tls.versions));
    }

    // By this point, the list of versions is either an Array or undefined.
    // If the user does not provide a list, the default list of supported TLS
    // versions should be used.
    const selectedVersions = tlsOptions.versions || tlsVersions.supported();

    // If the list contains any version that is not allowed. We should report
    // an error.
    const invalidVersions = selectedVersions.filter(v => tlsVersions.allowed().indexOf(v) === -1);

    if (invalidVersions.length) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, invalidVersions[0], tlsVersions.allowed().join(', ')));
    }

    // Although a specific TLS version is allowed, it does not mean it will
    // work because this will depend on the OpenSSL version. Thus, we need
    // to ensure that a version actually works before proceeding. If it does
    // not work, we need to report an error.
    const versions = tlsVersions.supported().filter(v => selectedVersions.indexOf(v) > -1);

    if (!versions.length) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
    }

    if (!isValidArray({ value: tlsOptions.ciphersuites })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST, tls.ciphersuites));
    }

    // By this point, ciphersuites is either an Array or undefined.
    const ciphersuites = tlsCiphers.overlaps(tlsOptions.ciphersuites || tlsCiphers.defaults());

    if (!ciphersuites.length) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE);
    }

    return true;
};
