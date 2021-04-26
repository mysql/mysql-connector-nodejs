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

exports.MESSAGES = {
    ERR_AUTH_MORE_INFO: 'Authentication failed using "MYSQL41" and "SHA256_MEMORY", check username and password or try a secure connection.',
    ERR_AUTH_UNSUPPORTED_SERVER: '%s authentication is not supported by the server.',
    ERR_CONNECTION_CLOSED: 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_CONNECTION_IDLE_FOR_TOO_LONG: 'This session was closed because the connection has been idle too long. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION: 'This session was closed because the connection has been killed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_CLIENT_INVALID_OPTION: "Client option '%s' is not recognized as valid.",
    ERR_CLIENT_INVALID_OPTION_VALUE: "Client option '%s' does not support value '%s'.",
    ERR_INCOMPLETE_PROTOCOL_MESSAGE: 'The server message is incomplete.',
    ERR_INVALID_CONNECTION_ATTRIBUTES_CONVENTION: 'Connection attribute names cannot start with "_".',
    ERR_INVALID_CONNECTION_ATTRIBUTES_DEFINITION: 'Invalid connection attributes definition.',
    ERR_INVALID_CONNECTION_TIMEOUT_VALUE: 'The connection timeout value must be a positive integer (including 0).',
    ERR_INVALID_INDEX_DEFINITION: 'Invalid index definition.',
    ERR_INVALID_INDEX_NAME: 'Invalid index name.',
    ERR_INVALID_PORT_RANGE: 'The port number must be between 0 and 65536.',
    ERR_INVALID_SAVEPOINT_NAME: 'Invalid Savepoint name.',
    ERR_MULTI_HOST_CONNECTION_TIMEOUT: 'All server connection attempts were aborted. Timeout of %d ms was exceeded for each selected server.',
    ERR_MULTI_HOST_CONNECTION_FAILURE: 'Unable to connect to any of the target hosts.',
    ERR_NO_EXPLICIT_CRITERIA_DOCUMENT: 'An explicit criteria needs to be provided with %s.',
    ERR_NO_EXPLICIT_CRITERIA_TABLE: 'An explicit criteria needs to be provided using where().',
    ERR_NON_MATCHING_ID_IN_REPLACEMENT_DOCUMENT: 'Replacement document has an _id that is different than the matched document.',
    ERR_POOL_CLOSED: 'Cannot close the pool. Maybe it has been destroyed already.',
    ERR_POOL_QUEUE_TIMEOUT: 'Could not retrieve a connection from the pool. Timeout of %d ms was exceeded.',
    ERR_SERVER_GONE_AWAY: 'The server has gone away.',
    ERR_SERVER_SHUTDOWN: 'This session was closed due to a server shutdown.',
    ERR_SINGLE_HOST_CONNECTION_TIMEOUT: 'Connection attempt to the server was aborted. Timeout of %d ms was exceeded.',
    ERR_SRV_LOOKUP_INVALID_OPTION: 'SRV resolution can only be toggled using a boolean value (true or false).',
    ERR_SRV_LOOKUP_WITH_PORT: 'Specifying a port number with DNS SRV lookup is not allowed.',
    ERR_SRV_LOOKUP_WITH_LOCAL_SOCKET: 'Using Unix domain sockets with DNS SRV lookup is not allowed.',
    ERR_SRV_LOOKUP_WITH_MULTIPLE_ENDPOINTS: 'Specifying multiple hostnames with DNS SRV lookup is not allowed.',
    ERR_SRV_RECORDS_NOT_AVAILABLE: 'Unable to locate any hosts for %s.',
    ERR_TABLE_INSERT_FIELDS: 'Table fields must be provided as multiple Strings, an Array or an Object with the column name and value',
    ERR_TLS_DISABLED_IN_SERVER: 'The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.',
    ERR_TLS_DISABLED_WITH_OPTIONS: 'Additional TLS options cannot be specified when TLS is disabled.',
    ERR_TLS_INVALID_CA_PATH: 'The certificate authority (CA) file path is not valid.',
    ERR_TLS_INVALID_CRL_PATH: 'The certificate revocation list (CRL) file path is not valid.',
    ERR_TLS_INVALID_CIPHERSUITE_LIST_DEFINITION: '%s is not a valid TLS ciphersuite list format.',
    ERR_TLS_INVALID_VERSION_LIST_DEFINITION: '"%s" is not a valid TLS protocol list format.',
    ERR_TLS_LIST_CONTAINS_INVALID_VERSION: '"%s" is not a valid TLS protocol version. Should be one of %s.',
    ERR_TLS_NO_SUPPORTED_VERSION_AVAILABLE: 'No supported TLS protocol version found in the provided list.',
    ERR_TLS_NO_VALID_CIPHERSUITE_AVAILABLE: 'No valid ciphersuite found in the provided list.',
    ERR_TLS_VERSION_NEGOTIATION_FAILED: 'Client network socket disconnected before secure TLS connection was established',
    ERR_UNEXPECTED_PROTOCOL_MESSAGE: 'Unexpected protocol message %d.',
    ERR_UNIQUE_INDEX_NOT_SUPPORTED: 'Unique indexes are currently not supported.',
    ERR_UNKNOWN_PROTOCOL_HEADER: 'The server message contains an invalid header.',
    ERR_WIRE_PROTOCOL_HEADER: 'The connection does not support the X Protocol. Make sure you are connected to the correct port on a MySQL 5.7.12 (or higher) server.',
    ERR_XOR_NON_MATCHING_BUFFER_SIZE: 'The buffers must have the same size.'
};

exports.ERR_DATABASE_DOES_NOT_EXIST = 1008;
exports.ERR_AUTHENTICATION_FAILED = 1045;
exports.ERR_UNKNOWN_COMMAND = 1047;
exports.ERR_SERVER_SHUTDOWN = 1053;
exports.ERR_MAX_PREPARED_STATEMENT_COUNT = 1461;
exports.ERR_CONNECTION_IDLE_FOR_TOO_LONG = 1810;
exports.ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION = 3169;
exports.ERR_MULTI_HOST_CONNECTION_FAILURE = 4001;
exports.ERR_CAPABILITY_PREPARE_FAILED = 5001;
exports.ERR_UNKNOWN_CAPABILITY = 5002;

exports[1008] = 'ERR_DATABASE_DOES_NOT_EXIST';
exports[1045] = 'ERR_AUTHENTICATION_FAILED';
exports[1047] = 'ERR_UNKNOWN_COMMAND';
exports[1053] = 'ERR_SERVER_SHUTDOWN';
exports[1461] = 'ERR_MAX_PREPARED_STATEMENT_COUNT';
exports[1810] = 'ERR_CONNECTION_IDLE_FOR_TOO_LONG';
exports[3169] = 'ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION';
exports[4001] = 'ERR_MULTI_HOST_CONNECTION_FAILURE';
exports[5001] = 'ERR_CAPABILITY_PREPARE_FAILED';
exports[5002] = 'ERR_UNKNOWN_CAPABILITY';
