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

const errors = require('../constants/errors');
const fs = require('fs');
const tls = require('tls');
const tlsCiphers = require('./ciphers');
const tlsVersions = require('./versions');
const util = require('util');
const { isValidArray, isValidPEM, isValidString } = require('../validator');

/**
 * Create a valid security context compatible with the Node.js TLS socket API
 * https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options
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
    // Certificate identity verification can be performed using a builtin
    // function or a custom application-provided function.
    // https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_checkserveridentity_hostname_cert
    if (typeof options.checkServerIdentity === 'undefined') {
        // If a custom function is not provided, we should use a no-op one that
        // skips the identity check.
        options.checkServerIdentity = () => { /* no-op */ };
    } else if (options.checkServerIdentity === true) {
        // If certificate identity verification is explicitly enabled, we can
        // rely on the builtin "checkServerIdentity" function, which simply
        // ensures the names match.
        // Deleting the property will ensure the builting function is used.
        delete options.checkServerIdentity;
    }
    // We need to create the proper security context containing any
    // certificates, TLS versions or ciphersuites that have been provided.
    // Applications can also provide any additional option supported by the
    // Node.js security context.
    // https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options
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

    // We should include any reference that is provided to a certificate
    // authority .
    if (options.ca) {
        // When we provide a CA file, we want the server certificate to be
        // verified against the chain of certificate authorities defined by
        // the file, and throw an error if the verification fails.
        context.rejectUnauthorized = true;
        // For convenience, if the certificate authority is not a
        // PEM-formatted string we read the file first. Otherwise, we assume
        // it follows the same convention used by the core Node.js API to
        // create a secure context.
        // https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options
        context.ca = (!isValidPEM({ value: options.ca }) && !isValidArray({ value: options.ca, validator: isValidPEM })) ? fs.readFileSync(options.ca) : options.ca;
    }

    // We should also include any provided certificate revocation list.
    if (options.crl) {
        // For convenience, if the certificate revocation list is not a
        // PEM-formatted string we read the file first. Otherwise, we assume
        // it follows the same convention used by the core Node.js API to
        // create a secure context.
        // https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options
        context.crl = (!isValidPEM({ value: options.crl }) && !isValidArray({ value: options.crl, validator: isValidPEM })) ? fs.readFileSync(options.crl) : options.crl;
    }

    return context;
};

/**
 * Validate the TLS options.
 * @private
 * @param {Object} params
 * @param {TLS} [params.tls] - wether TLS should be enabled or disabled
 * @param {DeprecatedSSLOptions} [params.sslOptions] - deprecated property to provide additional TLS options
 * @returns {boolean} Returns true all properties and values are valid.
 * @throws when TLS should be disabled and additional properties are provided,
 * when any path to a certificate authority or certificate revocation file is
 * not a valid string, when the list of TLS versions does not include any valid
 * one, or contains one that is not supported, or when the list of ciphersuites
 * does not include any valid one
 */
exports.validate = function ({ tls, sslOptions }) {
    const tlsOptions = Object.assign({}, tls, sslOptions);

    // Validate any CA file path or CA file content.
    if (!isValidPEM({ value: tlsOptions.ca }) && !isValidArray({ value: tlsOptions.ca, validator: isValidPEM }) && !isValidString({ value: tlsOptions.ca })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CA_PATH);
    }

    // Validate any CRL file path or CRL file content.
    if (!isValidPEM({ value: tlsOptions.crl }) && !isValidArray({ value: tlsOptions.crl, validator: isValidPEM }) && !isValidString({ value: tlsOptions.crl })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_TLS_CRL_PATH);
    }

    // Check if TLS versions are provided in a valid list-like format.
    if (!isValidArray({ value: tlsOptions.versions })) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION_LIST, tlsOptions.versions));
    }

    // If the application does not provide a custom list, we can use the
    // list containing only the supported TLS versions by default.
    const selectedVersions = tlsOptions.versions || tlsVersions.supported();

    // TLSv1 and TLSv1.1 are valid versions but are not supported.
    const unsupported = selectedVersions.filter(v => tlsVersions.unsupported().indexOf(v) > -1);
    // Everything other than valid TLS versions is not allowed.
    const unallowed = selectedVersions.filter(v => tlsVersions.allowed().indexOf(v) === -1 && tlsVersions.unsupported().indexOf(v) === -1);

    // If the list does not include a supported TLS version and includes
    // any supported version, we should report the appropriate error.
    if (unsupported.length && unsupported.length + unallowed.length === selectedVersions.length) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_INSECURE_TLS_VERSIONS, unsupported[0], tlsVersions.allowed().join(', ')));
    }

    // If the list does not include a supported TLS version and includes
    // other invalid versions, we should report the appropriate error.
    if (unallowed.length && unallowed.length === selectedVersions.length) {
        throw new Error(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, unallowed[0], tlsVersions.allowed().join(', ')));
    }

    // Although a specific TLS version is allowed, it does not mean it will
    // work because this will depend on the OpenSSL version used by the Node.js
    // engine. Thus, we need to ensure that a version actually works before
    // proceeding.
    const versions = selectedVersions.filter(v => tlsVersions.supported().indexOf(v) > -1);

    // If the final list does not contain any TLS version that is actually
    // supported by the client, we should report the appropriate error.
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
