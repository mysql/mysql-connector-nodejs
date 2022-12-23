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

const Client = require('../Protocol/Client');
const Net = require('net');
const TLS = require('tls');
const IntegerType = require('../Protocol/Wrappers/ScalarValues/int64').Type;
const authenticationManager = require('../Authentication/AuthenticationManager');
const errors = require('../constants/errors');
const logger = require('../logger');
const multiHost = require('../topology/multi-host');
const pkg = require('../package');
const secureContext = require('../tls/secure-context');
const srv = require('../topology/dns-srv');
const system = require('../system');
const util = require('util');
const warnings = require('../constants/warnings');
const { isValidBoolean, isValidInteger, isValidPlainObject } = require('../validator');

/**
 * This module specifies the interface of an internal MySQL server connection.
 * @module Connection
 */

/**
 * Convert either all integers to a BigInt or to a string, or alternatively,
 * convert only unsafe integers to a BigInt or to a string.
 * @readonly
 * @name IntegerType
 * @enum {string}
 * @example
 * IntegerType.BIGINT
 * IntegerType.STRING
 * IntegerType.UNSAFE_BIGINT
 * IntegerType.UNSAFE_BIGINT
 */

/**
 * MySQL server endpoint details.
 * @typedef {Object} Endpoint
 * @prop {string} [host=localhost] - hostname or IP (v4 or v6) of a MySQL server instance
 * @prop {number} [port=33060] - X Plugin port on the MySQL server instance
 * @prop {number} [priority] - priority of an endpoint relative to the others (endpoints with higher priority are picked first)
 * @prop {string} [socket] - relative or absolute path of a local Unix socket file
 */

/**
 * Connection TLS-specific properties.
 * @typedef {Object} TLS
 * @prop {boolean} [enabled=true] - enables or disables TLS
 * @prop {string} [ca] - path of a file containing a certificate authority chain used to verify the server certificate
 * @prop {string} [crl] - path of a file containing a certificate revocation list used, alongside a certificate authority, to verify the server certificate
 * @prop {string[]} [versions=TLSv1.2, TLSv1.3] - restrict the list of allowed TLS versions (TLSv1.2, TLSv1.3)
 * @prop {string[]} [ciphershuites] - list of ciphersuites to allow (IANA syntax)
 */

/**
 * Connection configuration properties.
 * @typedef {Object} Properties
 * @prop {string} [auth] - name of the client-side authentication mechanism to use
 * @prop {number} [connectTimeout=10000] - maximum ammount of time (ms) to wait for a server connection to be opened
 * @prop {Object} [connectionAttributes={}] - key-value object containing names and values of session attributes
 * @prop {module:Connection~Endpoint[]} [endpoints=[]] - list of endpoints to connect to
 * @prop {string} [host=localhost] - hostname or IP (v4 or v6) of a MySQL server instance
 * @prop {string} [password] - password for the MySQL account (defaults to '')
 * @prop {number} [port=33060] - X Plugin port on the MySQL server instance
 * @prop {boolean} [resolveSrv=false] - enable or disable DNS SRV resolution
 * @prop {string} [schema] - default database to connect to (defaults to '')
 * @prop {string} [socket] - relative or absolute path of a local Unix socket file
 * @prop {boolean} [resolveSrv=false] - use the host to perform a DNS SRV lookup and obtain the list of endpoints
 * @prop {module:Connection~TLS} [tls] - TLS options
 * @prop {string} [user] - user of the MySQL account (defaults to '')
 */
const VALID_OPTIONS = [
    'auth',
    'connectTimeout',
    'connectionAttributes',
    'dbPassword', // deprecated
    'dbUser', // deprecated
    'endpoints',
    'host',
    'integerType',
    'password',
    'port',
    'resolveSrv',
    'schema',
    'socket',
    'ssl', // deprecated
    'sslOptions', // deprecated
    'tls',
    'user'
];

/**
 * @private
 * @typedef {Object} DefaultSessionAttributes Default set of session
 * attributes created by the client when connecting to a MySQL server that
 * supports session attributes.
 * @prop {string} _pid - client process id
 * @prop {string} _platform - platform name of the processor architecture
 * @prop {string} _os - name and version of the operating system
 * @prop {string} _client_name - name of the client product
 * @prop {string} _client_version - version of the client product
 * @prop {string} _client_license - license name of the client product
 */
const CLIENT_SESSION_ATTRIBUTES = {
    _pid: system.pid(),
    _platform: system.platform(),
    _os: system.brand(),
    _source_host: system.hostname(),
    _client_name: pkg.name(),
    _client_version: pkg.version(),
    _client_license: pkg.license()
};

/**
 * Stringifies all the values in a given object.
 * @private
 * @param {Object} obj
 * @returns {Object}
 */
function stringifyValues (obj = {}) {
    let root = true;

    return JSON.stringify(obj, (k, v) => {
        // The replacer should skip the root node to avoid a stack overflow.
        if (root) {
            root = false;
            return v;
        }

        // If the value is undefined, in order to keep consistency between
        // connection strings and configuration objects, we coerce it to
        // an empty string. If the value is null (only possible with a
        // configuration object), we also coerce to an empty string in order
        // to avoid saving 'null'.
        if (typeof v === 'undefined' || v === null) {
            return '';
        }

        // If the value is already a string, we should not do anything.
        if (typeof v === 'string') {
            return v;
        }

        // If the value is neither an object nor an array, we return its
        // stringified version.
        if (typeof v !== 'object') {
            return JSON.stringify(v);
        }

        // Otherwise we need to recursively do the same for the values in "v".
        return stringifyValues(v);
    });
}

/**
 * @private
 * @typedef {Object} DeprecatedSSLOptions
 * @prop {string} [ca] - deprecated connection property for providing a path to a certificate authority file
 * @prop {string} [crl] - deprecated connection property for providing a path to a certificate revocation list file
 */

/**
 * Toggle deprecation warnings for deprecated connection properties.
 * @private
 * @param {Object} params
 * @param {string} [params.dbPassword] - deprecate connection property for the MySQL account password
 * @param {string} [params.dbUser] - deprecated connection property for the MySQL account user
 * @param {boolean} [params.ssl] - deprecated connection property for enabling or disabling TLS
 * @param {DeprecatedSSLOptions} [params.dbUser] - deprecated connection property for additional SSL options
 * @returns {boolean}
 */
function deprecate ({ dbPassword, dbUser, ssl, sslOptions }) {
    const log = logger('connection:options');

    // The "dbPassword" property is deprecated.
    if (typeof dbPassword !== 'undefined') {
        log.warning('dbPassword', warnings.MESSAGES.WARN_DEPRECATED_DB_PASSWORD, {
            type: warnings.TYPES.DEPRECATION,
            code: warnings.CODES.DEPRECATION
        });
    }

    // The "dbUser" property is deprecated.
    if (typeof dbUser !== 'undefined') {
        log.warning('dbUser', warnings.MESSAGES.WARN_DEPRECATED_DB_USER, {
            type: warnings.TYPES.DEPRECATION,
            code: warnings.CODES.DEPRECATION
        });
    }

    // The "ssl" and "sslOptions" properties are deprecated.
    if (typeof ssl !== 'undefined') {
        log.warning('ssl', warnings.MESSAGES.WARN_DEPRECATED_SSL_OPTION, {
            type: warnings.TYPES.DEPRECATION,
            code: warnings.CODES.DEPRECATION
        });
    }

    if (typeof sslOptions !== 'undefined') {
        log.warning('sslOptions', warnings.MESSAGES.WARN_DEPRECATED_SSL_ADDITIONAL_OPTIONS, {
            type: warnings.TYPES.DEPRECATION,
            code: warnings.CODES.DEPRECATION
        });
    }

    return true;
}

/**
 * @private
 * @alias module:Connection
 * @param {Properties} - connection properties
 * @returns {module:Connection}
 */
function Connection ({ auth, connectionAttributes = {}, connectTimeout = 10000, dbPassword, dbUser, endpoints = [], host = 'localhost', integerType = IntegerType.UNSAFE_STRING, password = '', port = 33060, schema, socket, resolveSrv = false, ssl, sslOptions, tls = {}, user = '' } = {}) {
    // Internal connection state.
    const state = {
        // Contains the name of the authentication mechanism that is
        // effectively negotiated with the server.
        auth,
        // Indicates if the connection supports prepared statements (MySQL
        // 8.0.16 or higher).
        canPrepareStatements: true,
        // Contains the list of connection capabilities that were effectively
        // negotiated with the server.
        capabilities: {},
        // Tracks an internal X Protocol client instance.
        client: null,
        // We keep a list of available and unavailable endpoints for
        // connection failover.
        endpoints: {
            // If there is a list of endpoints, we should use it.
            // If not, it should only include an endpoint with the details
            // specified by the "host", "port" and/or "socket" properties or
            // by the first and only element in that list.
            // When a connection is first opened, all endpoints should be
            // available. This can change if a socket cannot be created for
            // a given endpoint.
            available: endpoints.length ? endpoints : [{ host, port, socket }],
            unavailable: []
        },
        // Indicates the connection is being closed.
        isClosing: false,
        // Indicates if the connection established with the server
        // is using TLS.
        isSecure: false,
        // Indicates if the connection should be retried to the same endpoint.
        retry: false,
        // Indicates the number of milliseconds to wait before retrying a
        // specific endpoint.
        retryAfter: 20000,
        // Contains the connection id assigned by the server.
        serverId: null,
        // Contains the list of statements that were prepared and exist in the
        // scope of the associated server session.
        statements: [],
        // Merges any contents of the deprecated "ssl" and "sslOptions"
        // properties with the content of the "tls" property.
        // For tls.enable = true, we need to ensure that ssl !== false.
        // Additional options are merged with precedence for those defined
        // using the "tls" property, except for "ciphersuites" and "versions"
        // which we want to override given the validation constraints.
        tls: Object.assign({}, { enabled: ssl === false ? ssl : true }, sslOptions, tls),
        // Tracks the list of capabilities that the server does not know.
        unknownCapabilities: []
    };

    return {
        /**
         * Adds a set of connection capabilities to the existing ones.
         * @private
         * @function
         * @name module:Connection#addCapabilities
         * @param {Object} capabilities - set of capabilities
         * @returns {module:Connection} The connection instance
         */
        addCapabilities (capabilities) {
            state.capabilities = Object.assign({}, state.capabilities, capabilities);

            return this;
        },

        /**
         * Checks if the connection setup allows to retry authentication.
         * @private
         * @function
         * @name module:Connection:allowsAuthenticationRetry
         * @returns {boolean}
         */
        allowsAuthenticationRetry () {
            // If the application provides its own authentication mechanism,
            // there is no reason to retry.
            if (this.hasCustomAuthenticationMechanism()) {
                return false;
            }

            // If the connection is secure, it means the authentication
            // failed because the credentials did not match, so we should
            // not allow a retry.
            if (state.endpoints.available[0].socket || state.tls.enabled) {
                return false;
            }

            // Which leaves us with checking if the server supports or not
            // the fallback authentication mechanism.
            return this.allowsAuthenticationWith('SHA256_MEMORY');
        },

        /**
         * Checks if a given authentication mechanism can be used with the
         * connection.
         * @private
         * @function
         * @name module:Connection#allowsAuthenticationWith
         * @param {string} mechanism - name of the authentication mechanism
         * @returns {boolean}
         */
        allowsAuthenticationWith (mechanism) {
            // This is a workaround because on MySQL 5.7.x, calling
            // Mysqlx.Connection::CapabilitiesGet over a unix socket does not
            // return `PLAIN` while is in fact supported.
            const serverSupportedMechanisms = (state.capabilities['authentication.mechanisms'] || []).concat('PLAIN');

            return serverSupportedMechanisms.indexOf(mechanism) > -1;
        },

        /**
         * Negotiates the proper authentication mechanism for the connection user.
         * @private
         * @function
         * @name module:Connection#authenticate
         * @returns {module:Connection} The connection instance
         */
        authenticate () {
            // Try the custom authentication mechanism, if it is provided,
            // PLAIN, if the connection is secure, or MYSQL41, if not.
            const mechanism = this.getAuth();

            if (!this.allowsAuthenticationWith(mechanism)) {
                const message = util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, mechanism);
                const error = new Error(message);
                error.info = { code: errors.ER_ACCESS_DENIED_ERROR, msg: message };

                return Promise.reject(error);
            }

            return this.authenticateWith(mechanism)
                .catch(err => {
                    // If the setup does not allow to retry the authentication
                    // or if the error is not related to authentication we
                    // should report it.
                    if (!this.allowsAuthenticationRetry() || (err.info && err.info.code !== errors.ER_ACCESS_DENIED_ERROR)) {
                        throw err;
                    }

                    // Otherwise we should perform the fallback strategy and
                    // try with SHA256_MEMORY.
                    return this.authenticateWith('SHA256_MEMORY')
                        .catch(err => {
                            // If it is not an authentication error, we should bubble that
                            // error instead.
                            if (err.info && err.info.code !== errors.ER_ACCESS_DENIED_ERROR) {
                                throw err;
                            }

                            // Otherwise, we improve the existing error message.
                            err.message = err.info.msg = errors.MESSAGES.ER_DEVAPI_AUTH_MORE_INFO;

                            throw err;
                        });
                });
        },

        /**
         * Authenticates the connection user with a given mechanism.
         * @private
         * @function
         * @name module:Connection#authenticateWith
         * @param {string} mechanism - name of the authentication mechanism
         * @returns {Promise<module:Connection>} A Promise that resolves to the
         * connection instance.
         */
        authenticateWith (mechanism) {
            const plugin = authenticationManager.getPlugin(mechanism);
            const theUser = this.getUser();
            // We don't expose a getPassword() method because, the connection
            // is publicly available with session._getConnection()
            const thePassword = password || dbPassword || '';

            return plugin({ password: thePassword, schema, user: theUser }).run(state.client)
                .then(session => {
                    state.auth = mechanism;
                    state.serverId = session.connectionId;

                    return this;
                });
        },

        /**
         * Retrieves the server-side connection capabilities that have been
         * effectively negotiated.
         * @private
         * @function
         * @name module:Connection#capabilitiesGet
         * @returns {Promise}
         */
        capabilitiesGet () {
            return state.client.capabilitiesGet();
        },

        /**
         * Negotiates a set of connection capabilities with the server
         * (X Plugin).
         * @private
         * @function
         * @name module:Connection#capabilitiesSet
         * @returns {Promise}
         */
        capabilitiesSet () {
            // TODO(Rui): any additional capability, such as compression, can
            // be negotiated in this pipeline.
            const capabilities = {};

            // If TLS is enabled and the connection is not using a local Unix socket,
            // we need to enable TLS in the X Plugin.
            if (state.tls.enabled === true && !state.endpoints.available[0].socket) {
                // The X Protocol capability name is "tls".
                capabilities.tls = true;
            }

            // If connection attributes are to be sent, we need to merge the
            // default client attributes. Additionally, if the server does
            // not support session attributes, the connection is re-tried and
            // we should disable them in the second attempt.
            if (connectionAttributes !== false && state.unknownCapabilities.indexOf('session_connect_attrs') === -1) {
                const attributes = Object.assign({}, CLIENT_SESSION_ATTRIBUTES, connectionAttributes);
                // The X Plugin requires all connection attributes to be
                // encoded as strings. The client attributes are already
                // expected to be strings. However, custom application
                // attributes that are not strings need to be coerced.
                // If they are not able to be coerced (e.g. null or
                // undefined), we should propagate the error reported by the
                // plugin.
                // The X Protocol capability name is "session_connect_attrs".
                capabilities.session_connect_attrs = JSON.parse(stringifyValues(attributes));
            }

            return state.client.capabilitiesSet(capabilities)
                .then(() => {
                    // Must return the client capabilities for further
                    // processing.
                    return capabilities;
                })
                .catch(err => {
                    // When TLS is not enabled in the server, we want
                    // to report back a custom message.
                    if (err.info && err.info.code === errors.ER_X_CAPABILITIES_PREPARE_FAILED) {
                        // By TLS not being enabled, it means that the X
                        // Plugin will report an error stating that the "tls"
                        // capability failed. This is a generic error that can
                        // mean any other capability is invalid, so we need to
                        // ensure we are dealing with TLS. Currently the only
                        // way to retrieve the capability name is to parse the
                        // error message.
                        const failedCapability = err.message.match(/Capability prepare failed for '([^']+)'.*/)[1];
                        // If the failure is not related to TLS, we should
                        // report the error as is.

                        if (failedCapability !== 'tls') {
                            throw err;
                        }

                        // Otherwise, we want to report a custom message.
                        const message = errors.MESSAGES.ER_DEVAPI_NO_SERVER_TLS;
                        err.message = message;
                        err.info.msg = message;

                        throw err;
                    }

                    // When a new capability is introduced, it will be unknown
                    // to older server versions. In that case, the server will
                    // report an error and will close the connection. However,
                    // since there is no way to ensure the capability is
                    // supported beforehand, we have to try and send it anyway
                    // asking for forgiveness instead of permission. Thus, in
                    // order to make it seamless to the application, we need
                    // to destroy the network socket and re-create the
                    // connection without the unknown capabilities.
                    if (!err.info || err.info.code !== errors.ER_X_CAPABILITY_NOT_FOUND) {
                        throw err;
                    }

                    // By this point, the server has sent back an
                    // ER_X_CAPABILITY_NOT_FOUND error and has closed the
                    // connection.
                    // So, the first thing we need to do is to track the
                    // unknown capability. Currently the only way to retrieve
                    // the capability name is to parse the error message.
                    const unknownCapability = err.message.match(/Capability '([^']+)'.*/)[1];
                    state.unknownCapabilities.push(unknownCapability);

                    // And we need to ensure that we re-create a connection to
                    // the same endpoint. Since we are now tracking unknown
                    // capabilities, any new connection will not try to
                    // negotiate those.
                    state.retry = true;

                    const socket = state.client.getConnection();
                    socket.destroy(err);
                });
        },

        /**
         * Closes the X Protocol connection and the underlying connection
         * socket.
         * This method is overriden by PoolConnection
         * @private
         * @function
         * @name module:Connection#close
         * @returns {Promise}
         */
        close () {
            return this.destroy();
        },

        /**
         * Creates a network socket to the most appropriate MySQL server
         * endpoint.
         * @private
         * @function
         * @name module:Connection#connect
         * @returns {Promise<module:Connection>}
         */
        connect () {
            return new Promise((resolve, reject) => {
                // We want to connect to the first endpoint that is available.
                const endpoint = state.endpoints.available[0];
                // In the case of multi-host connections, we want sane
                // defaults for each endpoint in the list, in order to
                // require less verbosity from the user.
                const nodeSocket = Net.connect({ host: endpoint.host || 'localhost', port: endpoint.port || 33060, path: endpoint.socket });

                nodeSocket.setTimeout(connectTimeout);

                // Actions to perform after a connection is successfully
                // established (including server session).
                const postConnect = connection => {
                    // We need to "remove" the timeout because we do not want
                    // the event to be triggered after the connection is
                    // effectively established.
                    // For now, we consider "connectTimeout" to be the maximum
                    // time it can take for a client socket (TLS or not) to
                    // successfully connect to the server.
                    nodeSocket.setTimeout(0);
                    return resolve(connection);
                };

                // Actions to perform when there is an error in the connection
                // stage.
                const postDisconnect = err => {
                    // We should cleanup the connection state.
                    this.reset();

                    // If there isn't an error, it means the socket has been
                    // closed by the server and the client was expecting it.
                    // There's nothing to do, the workflow is just finished
                    // by this point.
                    if (!err) {
                        return resolve();
                    }

                    // If there is an error, it means the socket has been
                    // closed with an error and we need to report it back
                    // to the application.
                    return reject(err);
                };

                // For now, we consider every error to happen at the
                // connection stage, to be fatal, and thus, we should stop and
                // close/destroy the connection.
                nodeSocket.once('ready', () => {
                    // We can start creating the client instance, which will
                    // hold the given connection. This is important because
                    // we do not need to keep the raw socket available
                    // everywhere but we still want to decouple the TLS logic.
                    state.client = new Client(nodeSocket);

                    // We can now start the process of creating a server-side
                    // X Protocol session.
                    return this.start().then(postConnect).catch(err => nodeSocket.destroy(err));
                });

                nodeSocket.once('error', err => {
                    // The "close" event will automatically be triggered.
                    state.error = err;
                });

                nodeSocket.once('timeout', () => {
                    const error = new Error();
                    error.name = 'ETIMEDOUT';

                    // The error message depends on whether the connection is
                    // multi-host or not.
                    if (!this.hasMultipleEndpoints()) {
                        error.message = util.format(errors.MESSAGES.ER_DEVAPI_CONNECTION_TIMEOUT, connectTimeout);
                    } else {
                        error.message = util.format(errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_TIMEOUT, connectTimeout);
                    }

                    // The connection must be manually closed.
                    // https://nodejs.org/docs/latest/api/net.html#net_event_timeout
                    nodeSocket.destroy(error);
                });

                nodeSocket.on('data', data => {
                    state.client.handleNetworkFragment(data);
                });

                nodeSocket.once('close', hasError => {
                    // When the endpoint becomes unvailable in the middle of
                    // some work load, we should delegate error handling to
                    // the specific worker.
                    if (!hasError && this.isOpen() && this.isActive()) {
                        // We are already past the connection stage.
                        return state.client.handleServerClose();
                    }

                    // When a fatal error happens in the server, it will close
                    // the connection, but since it is not a network error,
                    // "hasError" will be "false", so we need to account for
                    // that cenario. In that case, we can check if the
                    // connection is already active or not.
                    if (!hasError && this.isOpen()) {
                        // It means the connection was legitimately closed.
                        return postDisconnect();
                    }

                    // If we cannot retry, the current connection should
                    // become unavailable. One reason to retry the current
                    // connection is if the server is available but refused
                    // the connection with a non-fatal error (such as when
                    // a capability is not known).
                    if (!state.retry) {
                        // When a connection becomes unavailable, it should
                        // include the timestamp of when it was last tried.
                        const unavailable = Object.assign({}, state.endpoints.available.shift(), {
                            unavailableAt: system.time()
                        });

                        state.endpoints.unavailable.push(unavailable);
                    }

                    // If we are retrying now, we should prevent duplicate
                    // retries.
                    state.retry = false;

                    // By this point, there should be an error available in
                    // "state.error", which is updated for each error event in
                    // the socket (but also includes other kinds of errors).
                    const error = this.getError();

                    // We want to know if the the timeout has been reached for
                    // all the endpoints, or if there was a different issue.
                    if (!this.hasMoreEndpointsAvailable() && (!this.hasMultipleEndpoints() || error.name === 'ETIMEDOUT')) {
                        return postDisconnect(error);
                    }

                    // If we are in a multi-host setup and there are no more
                    // endpoints available, we want to raise a custom error
                    // as well.
                    if (!this.hasMoreEndpointsAvailable() && this.hasMultipleEndpoints()) {
                        error.name = 'ENOMOREHOSTS';
                        error.errno = errors.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED;
                        error.message = errors.MESSAGES.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED;

                        return postDisconnect(error);
                    }

                    // By this point, the list of available and unavailable
                    // endpoints is already up-to-date and if there are more
                    // endpoints available, we should try to connect to the
                    // next one in the list.
                    this.connect().then(postConnect).catch(postDisconnect);
                });
            });
        },

        /**
         * Asks the server to gracefully close the underlying X Protocol
         * connection.
         * @private
         * @function
         * @name module:Connection#destroy
         * @returns {Promise}
         */
        destroy () {
            // This operation should be idempotent because there is a chance
            // that the connection might already been closed by the server
            // we should check first.
            if (!this.isOpen() || state.isClosing) {
                return Promise.resolve();
            }

            const socket = state.client.getConnection();

            // Again, the operation should be idempotent, so, if the socket
            // reference has already been destroyed, there is nothing to do.
            if (socket.destroyed) {
                return Promise.resolve();
            }

            // Eventually, the socket is destroyed and a 'close' event is
            // emmitted. This is here just to make sure the operation does
            // not fail if the connection is, for some weird reason, manually
            // closed again by the application.
            state.isClosing = true;

            // The method is shared between this and "PoolConnection".
            // We cannot re-use "close()" because it is overrided by "PoolConnection".
            return state.client.connectionClose()
                .then(() => {
                    // The server closes the socket on their end so we also
                    // need to destroy our reference.
                    // This will trigger a 'close' event whose handler is responsible
                    // for further cleanup.
                    socket.destroy();

                    // The connection has been safely closed by now.
                    state.isClosing = false;
                });
        },

        /**
         * Enables TLS on the underlying network socket.
         * @private
         * @function
         * @name module:Connection#enableTLS
         * @returns {Promise}
         */
        enableTLS () {
            return new Promise(resolve => {
                const secureContextOptions = Object.assign({}, state.tls);
                // We already know TLS should be enabled.
                delete secureContextOptions.enabled;
                // We need to create a secure socket by providing the existing
                // socket and the proper security context.
                const nodeSocket = TLS.connect(Object.assign({}, { socket: state.client.getConnection() }, secureContext.create(secureContextOptions)));

                nodeSocket.once('secureConnect', () => {
                    state.isSecure = true;
                    // Once a TLS session is established, we need to
                    // update the socket reference.
                    state.client.setConnection(nodeSocket);
                    // Then we are done and can move along.
                    resolve();
                });

                // We need to re-attach the event listener in order to
                // be able to handle OpenSSL errors.
                nodeSocket.once('error', err => {
                    state.error = err;
                });

                // The stream is paused when a secure connection is
                // established in the socket, so we need to resume the
                // flow. The handler should be the same.
                nodeSocket.on('data', data => {
                    state.client.handleNetworkFragment(data);
                });
            });
        },

        /**
         * Checks if there is any ongoing workload in the connection.
         * @private
         * @function
         * @name module:Connection#isActive
         * @returns {boolean}
         */
        isActive () {
            return !!state.client && state.client.isRunning();
        },

        /**
         * Checks of the connection is being closed.
         * @private
         * @function module:Connection#isClosing
         * @returns {boolean}
         */
        isClosing () {
            return state.isClosing;
        },

        /**
         * Checks if the connection was created by a pool, which is never the
         * case for this API.
         * This method is overriden by {@link module:PoolConnection|PoolConnection}.
         * @private
         * @function
         * @name module:Connection#isFromPool
         * @returns {boolean} Returns false.
         */
        isFromPool () {
            return false;
        },

        /**
         * Checks if the connection is idle, which is never the case for this
         * API.
         * This method is overriden by {@link module:PoolConnection|PoolConnection}.
         * @private
         * @function
         * @name module:Connection#isIdle
         * @returns {boolean} Returns false.
         */
        isIdle () {
            // Standalone connections never become idle on the client side.
            return false;
        },

        /**
         * Checks if a server-side X Protocol connecion has been sucessfuly
         * established.
         * @private
         * @function
         * @name module:Connection#isOpen
         * @returns {boolean}
         */
        isOpen () {
            return state.client !== null && state.serverId !== null;
        },

        /**
         * Checks if we are in a middle of a connection retry.
         * @private
         * @function
         * @name module:Connection#isReconnecting
         * @returns {boolean}
         */
        isReconnecting () {
            return state.retry;
        },

        /**
         * Checks if the connection is using TLS.
         * @private
         * @function
         * @name module:Connection#isSecure
         * @returns {boolean}
         */
        isSecure () {
            return state.isSecure;
        },

        /**
         * Retrieves the name of the authentication mechanism that was
         * negotiated with the server.
         * @private
         * @function
         * @name module:Connection#getAuth
         * @returns {string}
         */
        getAuth () {
            // If an authentication mechanism is specified, we should try to
            // use it.
            if (state.auth) {
                return state.auth;
            }

            // If one is not specified and the connection is not secure, we
            // should use a mechanism that works with most widespread plugin:
            // "mysql_native_password".
            if (!state.endpoints.available[0].socket && !state.tls.enabled) {
                return 'MYSQL41';
            }

            // If the connection is secure, we should opt for the fastest
            // alternative which is sending credentials as clear text.
            return 'PLAIN';
        },

        /**
         * Retrieves the underlying X Protocol client instance.
         * @private
         * @function
         * @name module:Connection#getClient
         * @returns {Client}
         */
        getClient () {
            return state.client;
        },

        /**
         * Retrieves any error generated by the connection.
         * @private
         * @function
         * @name module:Connection#getError
         * @returns {Error}
         */
        getError () {
            // It does not make sense to have a default error value as part of
            // the connection state.
            return state.error || new Error(errors.MESSAGES.ER_DEVAPI_CONNECTION_CLOSED);
        },

        /**
         * Retrieves the conversion mode selected by the application to handle
         * downstream integer values.
         * @private
         * @function
         * @name module:Connection#getIntegerType
         * @returns {IntegerType}
         */
        getIntegerType () {
            return integerType;
        },

        /**
         * Retrieves the list of client-side ids associated to server-side
         * prepared statements created in the scope of the underlying X
         * Protocol session.
         * @private
         * @function
         * @name module:Connection#getPreparedStatements
         * @returns {number[]}
         */
        getPreparedStatements () {
            return state.statements;
        },

        /**
         * Toggles the a flag to indicate the connection does not support
         * server-side prepared statements.
         * @private
         * @function
         * @name module:Connection#disablePreparedStatements
         * @returns {module:Connection}
         */
        disablePreparedStatements () {
            state.canPrepareStatements = false;

            return this;
        },

        /**
         * Removes a deallocated prepared statement for the list of statements
         * associated to the X Protocol session.
         * @private
         * @function
         * @name module:Connection#removePreparedStatement
         * @param {number} id - the client-side prepared statement id
         * @returns {module:Connection}
         */
        removePreparedStatement (id) {
            state.statements[id - 1] = undefined;

            return this;
        },

        /**
         * Retrieves the hostname or IP (v4 or v6) address of the machine
         * where the MySQL server is hosted.
         * @private
         * @function
         * @name module:Connection#getServerHostname
         * @returns {string}
         */
        getServerHostname () {
            const endpoint = state.endpoints.available[0];

            // Local socket file paths have precedence over host:port combos
            // in the core Node.js APIs used to create a network socket.
            // So, we want to make it clear that a Unix socket is being used
            // in this case.
            if (endpoint.socket) {
                return;
            }

            return endpoint.host;
        },

        /**
         * Retrieves the server-side connection id.
         * @private
         * @function
         * @name module:Connection#getServerId
         * @returns {number}
         */
        getServerId () {
            return state.serverId;
        },

        /**
         * Retrieves the port number where the server is listening for
         * connections.
         * @private
         * @function
         * @name module:Connection#getServerPort
         * @returns {number}
         */
        getServerPort () {
            const endpoint = state.endpoints.available[0];

            // Local socket file paths have precedence over host:port combos
            // in the core Node.js APIs used to create a network socket.
            // So, we want to make it clear that a Unix socket is being used
            // in this case.
            if (endpoint.socket) {
                return;
            }

            return endpoint.port;
        },

        /**
         * Retrieves the path to the local Unix socket file used for
         * connecting to the server.
         * @private
         * @function
         * @name module:Connection#getServerSocketPath
         * @returns {string}
         */
        getServerSocketPath () {
            return state.endpoints.available[0].socket;
        },

        /**
         * Retrieves the name of the default schema associated to the
         * connection.
         * @private
         * @function
         * @name module:Connection#getSchemaName
         * @returns {string}
         */
        getSchemaName () {
            return schema;
        },

        /**
         * Retrieves the list of capabilities that are not known by the server.
         * @private
         * @function
         * @name module:Connection#getUnknownCapabilities
         * @returns {string[]}
         */
        getUnknownCapabilities () {
            return state.unknownCapabilities;
        },

        /**
         * Retrieves the MySQL account user associated to the connection.
         * @private
         * @function
         * @name module:Connection#getUser
         * @returns {string}
         */
        getUser () {
            // TODO(Rui): "dbUser" is deprecated.
            return user || dbUser || '';
        },

        /**
         * Checks if the connection is using a custom authentication mechanism
         * provided by the application.
         * @private
         * @function
         * @name module:Connection#hasCustomAuthenticationMechanism
         * @returns {boolean}
         */
        hasCustomAuthenticationMechanism () {
            return !!auth;
        },

        /**
         * Checks if there are endpoints available.
         * @private
         * @function
         * @name module:Connection#hasMoreEndpointsAvailable
         * @returns {boolean}
         */
        hasMoreEndpointsAvailable () {
            // Make sure the list of available endpoints is up-to-date.
            this.update();
            // If there are available endpoints, we can perform a failover.
            return state.endpoints.available.length > 0;
        },

        /**
         * Checks if the connection was configured with multiple endpoints.
         * @private
         * @function
         * @name module:Connection#hasMultipleEndpoints
         * @returns {boolean}
         */
        hasMultipleEndpoints () {
            return state.endpoints.available.length + state.endpoints.unavailable.length > 1;
        },

        /**
         * Creates a new connection to a MySQL endpoint.
         * @private
         * @function
         * @name module:Connection#open
         * @returns {Promise<module:Connection>}
         */
        open () {
            // Make sure the list of available endpoints is up-to-date.
            this.update();

            // If "resolveSrv" is disabled, it means we already have an
            // ordered list of endpoints and we can try to connect to the
            // first one.
            if (!resolveSrv) {
                // We sort the list of endpoints (one or more) according to
                // the set of multi-host rules.
                state.endpoints.available = multiHost.sort(state.endpoints.available);

                return this.connect();
            }

            // If "resolveSrv" is enabled, it means we need to retrieve the
            // ordered list of endpoints from a discovery service potentially
            // available at that host.
            return srv.lookup(state.endpoints.available[0].host)
                .then(endpoints => {
                    // We now have the effective ordered list of endpoints
                    // which we use to update the previous one.
                    state.endpoints.available = srv.sort(endpoints);

                    return this.connect();
                });
        },

        /**
         * Resets and re-uses the underlying X Protocol connection.
         * @private
         * @function
         * @name module:Connection#override
         * @returns {Promise<module:Connection>}
         */
        override () {
            // A connection pool calls this method when it wants to re-use an
            // existing connection.
            return state.client.sessionReset()
                .then(() => {
                    return this;
                });
        },

        /**
         * Resets the internal state of the connection.
         * @private
         * @function
         * @name module:Connection#reset
         * @returns {Promise<module:Connection>}
         */
        reset () {
            // The connection capabilities will no longer be up-to-date.
            state.capabilities = {};
            // The client instance contains the work queue, which might not be
            // empty, and needs to be dereferenced anyway.
            state.client = null;
            // The connection is not closing anymore.
            state.isClosing = false;
            // An existing server connection id is what tells if a connection
            // has been successfully established, so we need to deference it
            // as well, since the connection is closed by this point.
            state.serverId = null;
            // Any existing references to prepared statements associated to
            // the connection should be removed.
            state.statements = [];
            // Any unknown capabilities are also no longer valid.
            state.unknownCapabilities = [];
            // The connection has closed, so there are no retries left.
            state.retry = false;

            return this;
        },

        /**
         * Updates the underlying X Protocol client instance.
         * @private
         * @function
         * @name module:Connection#setClient
         * @returns {Promise<module:Connection>}
         */
        setClient (client) {
            state.client = client;

            return this;
        },

        /**
         * Executes the pipeline for creating a server-side X Protocol session.
         * @private
         * @function
         * @name module:Connection#start
         * @returns {Promise<module:Connection>}
         */
        start () {
            // Start the pipeline to create a new MySQL server session.
            return this.capabilitiesSet()
                .then(capabilities => {
                    // If TLS should be disabled, there is nothing else to do
                    // and we can proceed with the next pipeline stage.
                    if (!capabilities.tls) {
                        return;
                    }

                    // Otherwise, we need to create a secure socket.
                    return this.enableTLS();
                })
                .then(() => {
                    return this.capabilitiesGet();
                })
                .then(capabilities => {
                    // We should save the effective list of capabilities
                    // negotiated with the server.
                    return this.addCapabilities(capabilities);
                })
                .then(() => {
                    // Then we proceed to authenticate the user.
                    return this.authenticate();
                });
        },

        /**
         * Updates the availability of the possible MySQL endpoints specified
         * for the connection.
         * @private
         * @function
         * @name module:Connection#update
         * @returns {module:Connection}
         */
        update () {
            const now = system.time();
            // Check which unavailable endpoints can be re-tried.
            // If the current element in the list is not "retryable", neither
            // are the remaining. A retryable endpoint is any endpoint that has
            // been unavailable since at least the time interval defined by
            // state.retryAfter.
            while (state.endpoints.unavailable.length && now - state.endpoints.unavailable[0].unavailableAt > state.retryAfter) {
                // If an endpoint can be re-tried we need to move it back to
                // the list of available endpoints.
                state.endpoints.available.push(state.endpoints.unavailable.shift());
            }

            return this;
        }
    };
}

Connection.validate = function ({ connectionAttributes, connectTimeout, dbUser, dbPassword, endpoints, host, port, resolveSrv, socket, ssl, sslOptions, tls }) {
    // TODO(Rui): Remove after deprecation period (undetermined).
    deprecate({ dbUser, dbPassword, ssl, sslOptions });

    const ports = endpoints && endpoints.length ? endpoints.map(e => e.port) : [port];

    // The port must be an integer between 0 and 65536.
    if (ports.some(p => !isValidInteger({ value: p, min: 0, max: 65536 }))) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_PORT_RANGE);
    }

    // We delegate validation of the TLS-related options to the secureContext
    // module.
    secureContext.validate({ tls, ssl, sslOptions });

    // The value of "connectTimeout" should be used to set the TCP
    // socket timeout and must be a positive integer (including 0).
    if (!isValidInteger({ value: connectTimeout, min: 0 })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_TIMEOUT);
    }

    // If the custom application attributes are "undefined", we still
    // need to send the default client attributes to the server.
    // Otherwise, the custom application attributes must be defined
    // using a plain JavaScript object, false if they are to be
    // disabled or true, if they are to be ignored.
    if (!isValidBoolean({ value: connectionAttributes }) && !isValidPlainObject({ value: connectionAttributes })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
    }

    // If there are custom application attributes we need to validate their
    // name. Before doing that, we need to make sure we are not bothered by "undefined".
    if (Object.keys(Object.assign({}, connectionAttributes)).some(key => key.startsWith('_'))) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
    }

    // We delegate validation of the SRV-related options to the srv module.
    srv.validate({ resolveSrv, endpoints, host, port, socket });

    return true;
};

Connection.VALID_OPTIONS = VALID_OPTIONS;
Connection.CLIENT_SESSION_ATTRIBUTES = CLIENT_SESSION_ATTRIBUTES;
Connection.IntegerType = IntegerType;

module.exports = Connection;
