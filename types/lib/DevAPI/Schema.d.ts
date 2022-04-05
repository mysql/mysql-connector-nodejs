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

import Collection from './Collection';
import Table from './Table';

/**
 * The JSON schema validation options.
 * ```
 * interface ValidationOptions {
 *   schema?: object
 *   level?: 'off' | 'strict'
 * }
 * ```
 */
export interface ValidationOptions {
    schema?: object
    level?: 'off' | 'strict'
}

/**
 * Options supported when creating and modifying collections.
 * ```
 * interface CollectionOptions {
 *   validation?: object
 * }
 * ```
 */
interface CollectionOptions {
    validation?: ValidationOptions
}

/**
 * Options supported when creating new collections.
 * ```
 * interface CreateCollectionOptions {
 *   reuseExisting?: boolean
 *   validation?: object
 * }
 * ```
 */
export interface CreateCollectionOptions extends CollectionOptions {
    /**
     * Re-use an existing collection when available.
     * @defaultValue `false`
     */
    reuseExisting?: boolean
}

/**
 * Options supported when modifying existing collections.
 * ```
 * interface ModifyCollectionOptions {
 *   validation?: object
 * }
 * ```
 */
export interface ModifyCollectionOptions extends CollectionOptions {}

/**
 * Schema instance.
 */
interface Schema {
    /**
     * Creates a new collection in the schema.
     * @param name - The name of the collection to create.
     * @param options - Additional options to consider when creating the collection.
     * @returns A `Promise` that resolves to an instance of the collection that was created or is being used.
     */
    createCollection: (name: string, options?: CreateCollectionOptions) => Promise<Collection>
    /**
     * Deletes a collection from the schema.
     * @param name - The name of the collection to delete.
     * @returns A `Promise` that resolves when the collection has been deleted.
     */
    dropCollection: (name: string) => Promise<void>
    /**
     * Checks if the schema is available on the server.
     * @returns A `Promise` that resolves to true if the schema is available or false otherwise.
     */
    existsInDatabase: () => Promise<boolean>
    /**
     * Retrieves the instance of a potential collection in the current schema.
     * @param name - The name of the collection to access.
     * @returns An instance of the collection if it exists in the schema, otherwise returns undefined.
     */
    getCollection: (name: string) => Collection
    /**
     * Retrieves the instance of a potential collection in table format.
     * @param name - The name of the collection to access.
     * @returns A `Table` instance of the collection if it exists in the schema, otherwise returns undefined.
     */
    getCollectionAsTable: (name: string) => Table
    /**
     * Retrieves the list of existing collections in the server schema.
     * @returns A `Promise` that resolves to the list of collection instances once they are retrieved.
     */
    getCollections: () => Promise<Collection[]>
    /**
     * Retrieves the name of the current schema.
     * @returns A string containing the name of the current schema.
     */
    getName: () => string
    /**
     * Retrieves the instance of a potential table in the current schema.
     * @param name - The name of the table to access.
     * @returns An instance of the table if it exists in the schema, otherwise returns undefined.
     */
    getTable: (name: string) => Table
    /**
     * Retrieves the list of existing tables in the server schema.
     * @returns A `Promise` that resolves to the list of table instances once they are retrieved.
     */
    getTables: () => Promise<Table[]>
    /**
     * Modifies the options of an existing collection in the schema.
     * @param name - The name of the collection to modify.
     * @param options - New collection options.
     * @returns A `Promise` that resolves to an instance of the collection that has been modified.
     */
    modifyCollection: (name: string, options?: ModifyCollectionOptions) => Promise<Collection>
}

export default Schema;
