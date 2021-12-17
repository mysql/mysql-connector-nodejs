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

exports.MESSAGES = {
    WARN_DEPRECATED_CREATE_COLLECTION_REUSE_EXISTING: 'The "ReuseExistingObject" option in Schema.createCollection() is deprecated and will not be available in future versions. Use "reuseExisting" instead.',
    WARN_DEPRECATED_SSL_OPTION: 'The "ssl" property is deprecated and will be removed in future versions. Use "tls" instead.',
    WARN_DEPRECATED_SSL_ADDITIONAL_OPTIONS: 'The "sslOptions" property is deprecated and will be removed in future versions. Use "tls" instead.',
    WARN_DEPRECATED_ARRAY_DELETE: 'CollectionModify.arrayDelete() is deprecated and will be removed in future versions. Use CollectionModify.unset() instead.',
    WARN_DEPRECATED_DB_USER: 'The "dbUser" property is deprecated and will be removed in future versions. Use "user" instead.',
    WARN_DEPRECATED_DB_PASSWORD: 'The "dbPassword" property is deprecated and will be removed in future versions. Use "password" instead.',
    WARN_DEPRECATED_EXECUTE_SQL: 'Session.executeSql() is deprecated and will be removed in future versions. Use Session.sql() instead.',
    WARN_DEPRECATED_TLS_VERSION: 'The connection is using %s which is now deprecated and will be removed in a future release of MySQL. Be prepared to use TLSv1.2 or TLSv1.3 when you upgrade.',
    WARN_DEPRECATED_EXECUTE_CURSOR_OBJECT: 'Using an object in execute() is a deprecated behavior and will not be available in future versions. Use the execute(dataCallback, metadataCallback) signature instead.',
    WARN_DEPRECATED_LIMIT_SET_COUNT: 'setCount() is deprecated and will be removed in future versions. Use limit() instead.',
    WARN_DEPRECATED_LIMIT_WITH_OFFSET: 'Passing an offset to limit() is a deprecated behavior and will not be available in future versions. Use offset() instead.',
    WARN_DEPRECATED_TABLE_DELETE_EXPR_ARGUMENT: 'Passing an expression in Table.delete() is a deprecated behavior and will not be supported in future versions. Use TableDelete.where() instead.',
    WARN_DEPRECATED_TABLE_UPDATE_EXPR_ARGUMENT: 'Passing an expression in Table.update() is a deprecated behavior and will not be supported in future versions. Use TableUpdate.where() instead.',
    WARN_DEPRECATED_TABLE_INSERT_OBJECT_ARGUMENT: 'Passing objects to Table.insert() is a deprecated behavior and will not be supported in future versions.',
    WARN_DEPRECATED_RESULT_GET_AFFECTED_ROWS_COUNT: 'Result.getAffectedRowsCount() is deprecated and will be removed in future versions. Use Result.getAffectedItemsCount() instead.',
    WARN_DEPRECATED_SET_OFFSET: 'setOffset() is deprecated and will be removed in future versions. Use offset() instead.',
    WARN_STRICT_CERTIFICATE_VALIDATION: 'To verify if the server certificate was signed by a given certificate authority "ssl-mode" must be either "VERIFY_CA" or "VERIFY_IDENTITY".'
};

exports.CODES = {
    DEPRECATION: 'MYCONNJS001',
    GENERIC: 'MYCONNJS000'
};

exports.TYPES = {
    DEPRECATION: 'DeprecationWarning',
    GENERIC: 'WARNING'
};
