/*
 * Copyright (c) 2015, 2022, Oracle and/or its affiliates.
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

const Table = require('./Table');
const crypto = require('crypto');
const errors = require('../constants/errors');
const logger = require('../logger');
const schema = require('./Schema');
const sqlExecute = require('./SqlExecute');
const warnings = require('../constants/warnings');

const log = logger('api:session');

/**
 * This module specifies the interface of an X DevAPI Session, which is a
 * logical abstraction over a MySQL server connection.
 * @module Session
 */

/**
 * @private
 * @alias module:Session
 * @param {module:Connection} [connection] - X Protocol connection instance
 * @returns {module:Session}
 */
function Session (connection) {
    // With a connection pool, the connection instance is re-used in different
    // sessions. This means each session needs to have its own view of it.
    const state = {
        properties: {
            auth: connection.getAuth(),
            host: connection.getServerHostname(),
            pooling: connection.isFromPool(),
            port: connection.getServerPort(),
            schema: connection.getSchemaName(),
            socket: connection.getServerSocketPath(),
            tls: connection.isSecure(),
            user: connection.getUser()
        }
    };
    // The "dbUser" and "ssl" properties are deprecated.
    state.properties = Object.defineProperties(state.properties, {
        dbUser: {
            enumerable: true,
            get () {
                log.warning('inspect', warnings.MESSAGES.WARN_DEPRECATED_DB_USER, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });

                return state.properties.user;
            }
        },
        ssl: {
            enumerable: true,
            get () {
                log.warning('inspect', warnings.MESSAGES.WARN_DEPRECATED_SSL_OPTION, {
                    type: warnings.TYPES.DEPRECATION,
                    code: warnings.CODES.DEPRECATION
                });

                return state.properties.tls;
            }
        }
    });

    return {
        /**
         * Commit an ongoing database transaction in the scope of the current session.
         * @function
         * @name module:Session#commit
         * @returns {Promise}
         */
        commit () {
            return this.sql('COMMIT').execute()
                .then(() => {
                    return true;
                });
        },

        /**
         * Close the underlying connection to the database or release it back
         * into a connection pool.
         * @function
         * @name module:Session#close
         * @returns {Promise}
         */
        close () {
            return connection.close();
        },

        /**
         * Create a new database schema.
         * @function
         * @name module:Session#createSchema
         * @param {string} name - name of the schema
         * @returns {Promise<module:Schema>} A Promise that resolves to the schema instance.
         */
        createSchema (name) {
            // TODO(Rui): Table.escapeIdentifier belongs somewhere else.
            return this.sql(`CREATE DATABASE ${Table.escapeIdentifier(name)}`)
                .execute()
                .then(() => {
                    return this.getSchema(name);
                });
        },

        /**
         * Drop a database schema. If the schema does not exist, nothing
         * happens.
         * @function
         * @name module:Session#dropSchema
         * @param {string} name - name of the schema
         * @returns {Promise<boolean>} Returns true if the schema with the
         * given name was removed from the database or false if it did not
         * exist in the database.
         */
        dropSchema (name) {
            // TODO(Rui): Check if we can return false when the schema does not exist.
            return this.sql(`DROP DATABASE ${Table.escapeIdentifier(name)}`)
                .execute()
                .then(() => true)
                .catch(err => {
                    // Don't fail if the schema does not exist.
                    if (!err.info || err.info.code !== errors.ER_DB_DROP_EXISTS) {
                        throw err;
                    }

                    return false;
                });
        },

        /**
         * Executes a raw SQL statement in the database and reports back any
         * results.
         * @function
         * @name module:Session#executeSql
         * @param {string} sql - SQL statement
         * @returns {Promise<module:SqlExecute>}
         * @deprecated Will be removed in future versions. Use {@link module:Session#sql|Session.sql()} instead.
         */
        executeSql (sql) {
            log.warning('executeSql', warnings.MESSAGES.WARN_DEPRECATED_EXECUTE_SQL, {
                type: warnings.TYPES.DEPRECATION,
                code: warnings.CODES.DEPRECATION
            });

            return this.sql(sql);
        },

        /**
         * Returns an instance of the underlying connection (private API).
         * @private
         * @function
         * @name module:Session#getConnection_
         * @returns {module:Connection}
         */
        getConnection_ () {
            return connection;
        },

        /**
         * Retrieve the instance of any default schema associated to the
         * underlying database connection. If there is no default schema,
         * the instance will be undefined.
         * @function
         * @name module:Session#getDefaultSchema
         * @returns {module:Schema}
         */
        getDefaultSchema () {
            const name = connection.getSchemaName();

            if (!name) {
                return undefined;
            }

            return this.getSchema(name);
        },

        /**
         * Retrieve an instance of a schema with the given name.
         * @function
         * @name module:Session#getSchema
         * @param {string} name - name of the schema
         * @returns {module:Schema}
         */
        getSchema (name) {
            return schema(connection, name);
        },

        /**
         * Retrieve a list of instances of all the existing schemas in the
         * database.
         * @function
         * @name module:Session#getSchemas
         * @returns {Promise<module:Schema[]>}
         */
        getSchemas () {
            return this.sql('SHOW DATABASES')
                .execute()
                .then(res => {
                    return res.fetchAll().map(row => this.getSchema(row[0]));
                });
        },

        // TODO(Rui): Maybe deprecate in the future.
        /**
         * Retrieve the details of the underlying database connection.
         * @function
         * @name module:Session#inspect
         * @returns {Object}
         */
        inspect () {
            return state.properties;
        },

        /**
         * Release a given savepoint from an ongoing transaction in the
         * database.
         * @function
         * @name module:Session#releaseSavepoint
         * @param {string} name - name of the savepoint
         * @returns {Promise}
         */
        releaseSavepoint (name) {
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME));
            }

            return this.sql(`RELEASE SAVEPOINT ${Table.escapeIdentifier(name)}`)
                .execute();
        },

        /**
         * Roll back an ongoing database transaction in the scope of the
         * current session.
         * @function
         * @name module:Session#rollback
         * @returns {Promise}
         */
        rollback () {
            return this.sql('ROLLBACK').execute()
                .then(() => {
                    return true;
                });
        },

        /**
         * Go back to an existing savepoint within the scope of an ongoing
         * transaction.
         * @function
         * @name module:Session#rollbackTo
         * @param {string} name - name of the savepoint
         * @returns {Promise}
         */
        rollbackTo (name) {
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME));
            }
            return this.sql(`ROLLBACK TO SAVEPOINT ${Table.escapeIdentifier(name)}`)
                .execute();
        },

        /**
         * Create a new savepoint with the given name in the scope of ongoing
         * transaction. If a savepoint name is not provided, one will be
         * auto-generated.
         * @function
         * @name module:Session#setSavepoint
         * @param {string} [name] - name of the savepoint
         * @returns {Promise<string>} A Promise that resolves to the name of the savepoint.
         */
        setSavepoint (name = `connector-nodejs-${crypto.randomBytes(16).toString('hex')}`) {
            if (typeof name !== 'string' || !name.trim().length) {
                return Promise.reject(new Error(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME));
            }

            return this.sql(`SAVEPOINT ${Table.escapeIdentifier(name)}`)
                .execute()
                .then(() => {
                    return name;
                });
        },

        /**
         * Creates a new operational context to execute a SQL statement in the
         * database.
         * @function
         * @name module:Session#sql
         * @param {string} statement - SQL statement
         * @returns {Promise<module:SqlExecute>}
         */
        sql (statement) {
            return sqlExecute(connection, statement);
        },

        /**
         * Begin a new database transaction in the scope of the current
         * session.
         * @function
         * @name module:Session#startTransaction
         * @returns {Promise}
         */
        startTransaction () {
            return this.sql('BEGIN').execute()
                .then(() => {
                    return true;
                });
        }
    };
}

module.exports = Session;
