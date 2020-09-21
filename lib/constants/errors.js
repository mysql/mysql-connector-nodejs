/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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
    ERR_SERVER_SHUTDOWN: 'This session was closed due to a server shutdown.',
    ERR_CONNECTION_IDLE_FOR_TOO_LONG: 'This session was closed because the connection has been idle too long. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION: 'This session was closed because the connection has been killed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_TLS_DISABLED_IN_SERVER: 'The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.',
    ERR_CONNECTION_CLOSED: 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.',
    ERR_INCOMPLETE_PROTOCOL_MESSAGE: 'The server message is incomplete.',
    ERR_UNKNOWN_PROTOCOL_HEADER: 'The server message contains an invalid header.',
    ERR_WIRE_PROTOCOL_HEADER: 'The connection does not support the X Protocol. Make sure you are connected to the correct port on a MySQL 5.7.12 (or higher) server.'
};

exports.ERR_SERVER_SHUTDOWN = 1053;
exports.ERR_CONNECTION_IDLE_FOR_TOO_LONG = 1810;
exports.ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION = 3169;
exports.ERR_TLS_DISABLED_IN_SERVER = 5001;

exports[1053] = 'ERR_SERVER_SHUTDOWN';
exports[1810] = 'ERR_CONNECTION_IDLE_FOR_TOO_LONG';
exports[3169] = 'ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION';
exports[5001] = 'ERR_TLS_DISABLED_IN_SERVER';
