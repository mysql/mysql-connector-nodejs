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

/**
 * Custom application-level error messages.
 * @private
 */

exports.MESSAGES = {
    ER_CLIENT_NO_X_PROTOCOL: 'The connection does not support the X Protocol. Make sure you are connected to the correct port on a MySQL 5.7.12 (or higher) server.',
    ER_DEVAPI_AUTH_MORE_INFO: 'Authentication failed using "MYSQL41" and "SHA256_MEMORY", check username and password or try a secure connection.',
    ER_DEVAPI_AUTH_NONCE_MISMATCH: 'Invalid nonce length - expected %d bytes, got %d.',
    ER_DEVAPI_AUTH_UNSUPPORTED_SERVER: '%s authentication is not supported by the server.',
    ER_DEVAPI_AUTH_UNEXPECTED_STEP: 'Unexpected step for %s authentication.',
    ER_DEVAPI_BAD_AUTH_SCRAMBLE_BUFFER_SIZE: 'The buffers must have the same size.',
    ER_DEVAPI_BAD_CONNECTION_DEFINITION: 'The connection options must be defined using a plain JavaScript object, JSON or a connection string.',
    ER_DEVAPI_BAD_CLIENT_OPTION: "Client option '%s' is not recognized as valid.",
    ER_DEVAPI_BAD_CLIENT_OPTION_VALUE: "Client option '%s' does not support value '%s'.",
    ER_DEVAPI_BAD_CONNECTION_ENDPOINT_PRIORITY_RANGE: 'The priorities must be between 0 and 100.',
    ER_DEVAPI_BAD_CONNECTION_PORT_RANGE: 'The port number must be between 0 and 65536.',
    ER_DEVAPI_BAD_CONNECTION_STRING_FORMAT: 'Invalid connection string format.',
    ER_DEVAPI_BAD_CONNECTION_STRING_HOST: 'The connection string does not contain a valid host.',
    ER_DEVAPI_BAD_CONNECTION_STRING_SCHEME: 'Scheme %s is not valid.',
    ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME: 'The connection string contains an invalid schema name.',
    ER_DEVAPI_BAD_CONNECTION_STRING_USER_INFO: 'The connection string does not contain a valid username and/or password.',
    ER_DEVAPI_BAD_CONNECTION_TIMEOUT: 'The connection timeout value must be a positive integer (including 0).',
    ER_DEVAPI_BAD_FLEXIBLE_PARAMETER_EXPRESSION: 'Invalid flexible parameter input expression.',
    ER_DEVAPI_BAD_INDEX_DEFINITION: 'Invalid index definition.',
    ER_DEVAPI_BAD_INDEX_NAME: 'Invalid index name.',
    ER_DEVAPI_BAD_LIMIT_INPUT: 'The count value must be a non-negative integer.',
    ER_DEVAPI_BAD_LOCK_CONTENTION_MODE: 'Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".',
    ER_DEVAPI_BAD_OFFSET_INPUT: 'The offset value must be a non-negative integer.',
    ER_DEVAPI_BAD_SAVEPOINT_NAME: 'Invalid Savepoint name.',
    ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME: 'Connection attribute names cannot start with "_".',
    ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION: 'Invalid connection attributes definition.',
    ER_DEVAPI_BAD_SRV_LOOKUP_OPTION: 'SRV resolution can only be toggled using a boolean value (true or false).',
    ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT: 'Table fields must be provided as multiple Strings, an Array or an Object with the column name and value',
    ER_DEVAPI_BAD_TLS_CA_PATH: 'The certificate authority (CA) file path is not valid.',
    ER_DEVAPI_BAD_TLS_CRL_PATH: 'The certificate revocation list (CRL) file path is not valid.',
    ER_DEVAPI_BAD_TLS_CIPHERSUITE_LIST: '%s is not a valid TLS ciphersuite list format.',
    ER_DEVAPI_BAD_TLS_VERSION: '"%s" is not a valid TLS protocol version. Should be one of %s.',
    ER_DEVAPI_BAD_TLS_VERSION_LIST: '"%s" is not a valid TLS protocol list format.',
    ER_DEVAPI_CERTIFICATE_AUTHORITY_REQUIRED: '%s requires a certificate authority.',
    ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED: 'Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.',
    ER_DEVAPI_CONNECTION_CLOSED: 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ER_DEVAPI_CONNECTION_TIMEOUT: 'Connection attempt to the server was aborted. Timeout of %d ms was exceeded.',
    ER_DEVAPI_DOCUMENT_ID_MISMATCH: 'Replacement document has an _id that is different than the matched document.',
    ER_DEVAPI_DUPLICATE_CONNECTION_OPTION: 'The connection string cannot contain duplicate query parameters.',
    ER_DEVAPI_DUPLICATE_SESSION_ATTRIBUTE: 'The connection string cannot contain duplicate session attributes.',
    ER_DEVAPI_INCOMPLETE_PROTOCOL_MESSAGE: 'The server message is incomplete.',
    ER_DEVAPI_INSECURE_TLS_VERSIONS: '"%s" is no longer considered a safe TLS version and is not supported anymore. Use one of %s.',
    ER_DEVAPI_MISSING_DOCUMENT_CRITERIA: 'An explicit criteria needs to be provided with %s.',
    ER_DEVAPI_MISSING_TABLE_CRITERIA: 'An explicit criteria needs to be provided using where().',
    ER_DEVAPI_MIXED_CONNECTION_ENDPOINT_PRIORITY: 'You must either assign no priority to any of the routers or give a priority for every router.',
    ER_DEVAPI_MULTI_HOST_CONNECTION_TIMEOUT: 'All server connection attempts were aborted. Timeout of %d ms was exceeded for each selected server.',
    ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED: 'Unable to connect to any of the target hosts.',
    ER_DEVAPI_NO_SERVER_TLS: 'The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.',
    ER_DEVAPI_NO_SUPPORTED_TLS_VERSION: 'No supported TLS protocol version found in the provided list.',
    ER_DEVAPI_NO_SUPPORTED_TLS_CIPHERSUITE: 'No valid ciphersuite found in the provided list.',
    ER_DEVAPI_NO_UNIQUE_INDEX: 'Unique indexes are currently not supported.',
    ER_DEVAPI_POOL_CLOSED: 'Cannot close the pool. Maybe it has been destroyed already.',
    ER_DEVAPI_POOL_QUEUE_TIMEOUT: 'Could not retrieve a connection from the pool. Timeout of %d ms was exceeded.',
    ER_DEVAPI_SERVER_GONE_AWAY: 'The server has gone away.',
    ER_DEVAPI_SRV_LOOKUP_NO_PORT: 'Specifying a port number with DNS SRV lookup is not allowed.',
    ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET: 'Using Unix domain sockets with DNS SRV lookup is not allowed.',
    ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS: 'Specifying multiple hostnames with DNS SRV lookup is not allowed.',
    ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE: 'Unable to locate any hosts for %s.',
    ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED: 'Client network socket disconnected before secure TLS connection was established',
    ER_IO_READ_ERROR: 'This session was closed because the connection has been idle too long. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ER_SERVER_SHUTDOWN: 'This session was closed due to a server shutdown.',
    ER_SESSION_WAS_KILLED: 'This session was closed because the connection has been killed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ER_X_CLIENT_BAD_PROTOBUF_MESSAGE: 'Invalid %s protobuf message value.',
    ER_X_CLIENT_EMPTY_WORK_QUEUE: 'The internal work queue is empty.',
    ER_X_CLIENT_NO_COLUMN_METADATA: 'There is no metadata available for the given column.',
    ER_X_CLIENT_UNEXPECTED_PROTOCOL_MESSAGE: 'Unexpected protocol message %d.',
    ER_X_CLIENT_UNKNOWN_PROTOCOL_HEADER: 'The server message contains an invalid header.'
};

/**
 * MySQL Server errors.
 * https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html
 * @private
 */

exports.ER_DB_CREATE_EXISTS = 1007;
exports.ER_DB_DROP_EXISTS = 1008;
exports.ER_DBACCESS_DENIED_ERROR = 1044;
exports.ER_ACCESS_DENIED_ERROR = 1045;
exports.ER_UNKNOWN_COM_ERROR = 1047;
exports.ER_BAD_DB_ERROR = 1049;
exports.ER_TABLE_EXISTS_ERROR = 1050;
exports.ER_BAD_TABLE_ERROR = 1051;
exports.ER_SERVER_SHUTDOWN = 1053;
exports.ER_DUP_KEYNAME = 1061;
exports.ER_CANT_DROP_FIELD_OR_KEY = 1091;
exports.ER_WRONG_DB_NAME = 1102;
exports.ER_NO_SUCH_TABLE = 1146;
exports.ER_LOCK_DEADLOCK = 1213;
exports.ER_NOT_SUPPORTED_AUTH_MODE = 1251;
exports.ER_SP_DOES_NOT_EXIST = 1305;
exports.ER_MAX_PREPARED_STMT_COUNT_REACHED = 1461;
exports.ER_IO_READ_ERROR = 1810;
exports.ER_SESSION_WAS_KILLED = 3169;
exports.ER_LOCK_NOWAIT = 3572;

/**
 * X DevAPI errors.
 * @private
 */

exports.ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED = 4001;

/**
 * X Plugin errors.
 * https://github.com/mysql/mysql-server/blob/8.0/plugin/x/src/xpl_error.h
 * @private
 */

exports.ER_X_CAPABILITIES_PREPARE_FAILED = 5001;
exports.ER_X_CAPABILITY_NOT_FOUND = 5002;
exports.ER_X_INVALID_DATA = 5003;
exports.ER_X_BAD_INSERT_DATA = 5014;
exports.ER_X_CMD_NUM_ARGUMENTS = 5015;
exports.ER_X_CMD_ARGUMENT_TYPE = 5016;
exports.ER_X_CMD_ARGUMENT_VALUE = 5017;
exports.ER_X_CMD_ARGUMENT_OBJECT_EMPTY = 5020;
exports.ER_X_CMD_INVALID_ARGUMENT = 5021;
exports.ER_X_DUPLICATE_ENTRY = 5116;
exports.ER_X_EXPR_MISSING_ARG = 5152;
exports.ER_X_EXPR_BAD_VALUE = 5154;
exports.ER_X_INVALID_ADMIN_COMMAND = 5157;
exports.ER_X_EXPECT_FIELD_EXISTS_FAILED = 5168;
exports.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA = 5180;
exports.ER_X_INVALID_VALIDATION_SCHEMA = 5182;

/**
 * Global error mapping.
 * @private
 */

exports[1007] = 'ER_DB_CREATE_EXISTS';
exports[1008] = 'ER_DB_DROP_EXISTS';
exports[1044] = 'ER_DBACCESS_DENIED_ERROR';
exports[1045] = 'ER_ACCESS_DENIED_ERROR';
exports[1047] = 'ER_UNKNOWN_COM_ERROR';
exports[1049] = 'ER_BAD_DB_ERROR';
exports[1050] = 'ER_TABLE_EXISTS_ERROR';
exports[1051] = 'ER_BAD_TABLE_ERROR';
exports[1053] = 'ER_SERVER_SHUTDOWN';
exports[1061] = 'ER_DUP_KEYNAME';
exports[1091] = 'ER_CANT_DROP_FIELD_OR_KEY';
exports[1102] = 'ER_WRONG_DB_NAME';
exports[1146] = 'ER_NO_SUCH_TABLE';
exports[1213] = 'ER_LOCK_DEADLOCK';
exports[1251] = 'ER_NOT_SUPPORTED_AUTH_MODE';
exports[1305] = 'ER_SP_DOES_NOT_EXIST';
exports[1461] = 'ER_MAX_PREPARED_STMT_COUNT_REACHED';
exports[1810] = 'ER_IO_READ_ERROR';
exports[3169] = 'ER_SESSION_WAS_KILLED';
exports[3572] = 'ER_LOCK_NOWAIT';
exports[4001] = 'ER_DEVAPI_MULTI_HOST_CONNECTION_FAILED';
exports[5001] = 'ER_X_CAPABILITIES_PREPARE_FAILED';
exports[5002] = 'ER_X_CAPABILITY_NOT_FOUND';
exports[5003] = 'ER_X_INVALID_DATA';
exports[5014] = 'ER_X_BAD_INSERT_DATA';
exports[5015] = 'ER_X_CMD_NUM_ARGUMENTS';
exports[5016] = 'ER_X_CMD_ARGUMENT_TYPE';
exports[5017] = 'ER_X_CMD_ARGUMENT_VALUE';
exports[5020] = 'ER_X_CMD_ARGUMENT_OBJECT_EMPTY';
exports[5021] = 'ER_X_CMD_INVALID_ARGUMENT';
exports[5116] = 'ER_X_DUPLICATE_ENTRY';
exports[5152] = 'ER_X_EXPR_MISSING_ARG';
exports[5154] = 'ER_X_EXPR_BAD_VALUE';
exports[5157] = 'ER_X_INVALID_ADMIN_COMMAND';
exports[5168] = 'ER_X_EXPECT_FIELD_EXISTS_FAILED';
exports[5180] = 'ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA';
exports[5182] = 'ER_X_INVALID_VALIDATION_SCHEMA';
