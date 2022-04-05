/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

import Schema from './Schema';
import SqlExecute from './SqlExecute';

interface Session {
    /**
     * Commits an ongoing database transaction in the scope of the current
     * session.
     * @returns A `P`romise that resolves when the transaction is commited.
     */
    commit: () => Promise<void>
    /**
     * Closes the underlying connection to the database or release it back
     * into a connection pool.
     * @returns A `Promise` that resolves when the connection is closed.
     */
    close: () => Promise<void>
    /**
     * Creates a new database schema.
     * @param name - The name of the schema to create.
     * @returns A `Promise` that resolves to an instance of the schema.
     */
    createSchema: (name: string) => Promise<Schema>
    /**
     * Deletes a database schema. If the schema does not exist, nothing
     * happens.
     * @param name - The name of the schema to delete.
     * @returns A `Promise` that resolves to a `boolean` value which is
     * `true` if the schema was deleted or `false` if the schema does not
     * exist.
     */
    dropSchema: (name: string) => Promise<boolean>
    /**
     * Retrieves the instance of any default schema associated to the
     * underlying database connection. If there is no default schema,
     * the instance will be undefined.
     * @returns An instance of the default schema if one was defined.
     * Otherwise returns `undefined`.
     */
    getDefaultSchema: () => Schema
    /**
     * Retrieves an instance of a schema with the given name loaded into the
     * current session.
     * @param name - The name of the schema to look for.
     * @returns An instance of a schema if it exists.
     * Otherwise returns `undefined`.
     */
    getSchema: (name: string) => Schema
    /**
     * Retrieves a list of instances of all the accessible schemas in the
     * database.
     * @returns The list of all the accessible schemas in the database.
     */
    getSchemas: () => Schema[]
    /**
     * Releases a given savepoint from an ongoing transaction in the
     * database.
     * @param name - The name of an existing savepoint to release.
     * @returns A `Promise` that resolves when the savepoint has been released.
     */
    releaseSavepoint: (name: string) => Promise<void>
    /**
     * Rolls back an ongoing database transaction in the scope of the
     * current session.
     * @returns A `Promise` that resolves when the transaction has been rolled
     * back.
     */
    rollback: () => Promise<void>
    /**
     * Goes back to an existing savepoint within the scope of an ongoing
     * transaction.
     * @param name - The name of an existing savepoint.
     * @returns A `Promise` that resolves when a rollback to the savepoint
     * has finished.
     */
    rollbackTo: (name: string) => Promise<void>
    /**
     * Creates a new savepoint with the given name in the scope of ongoing
     * transaction. If a savepoint name is not provided, one will be
     * auto-generated.
     * @param name - The name of the savepoint (must be unique).
     * @returns A `Promise` that resolves to a `string` containing  the
     * name of the savepoint when it has been created.
     */
    setSavepoint: <T extends string>(name?: T) => Promise<T>
    /**
     * Creates a raw SQL statement.
     * @param statement - A string containing an SQL statement.
     * @returns A fluent statement instance.
     */
    sql: (statement: string) => SqlExecute
    /**
     * Initiates a new database transaction in the scope of the current
     * session.
     * @returns A `Promise` that resolves when the transaction starts.
     */
    startTransaction: () => Promise<void>
}

export default Session;
