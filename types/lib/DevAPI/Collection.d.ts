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

import CollectionAdd, { CollectionDocuments } from './CollectionAdd';
import CollectionFind from './CollectionFind';
import CollectionModify from './CollectionModify';
import CollectionRemove from './CollectionRemove';
import { SearchConditionStr } from './Filtering';
import Result from './Result';
import Schema from './Schema';

/**
 * Index field definition object.
 * ```
 * interface FieldDefinition {
 *   field: string
 *   options?: number
 *   required?: boolean
 *   srid?: number
 *   type: string
 * }
 * ```
 */
export interface FieldDefinition {
    /**
     * Name of the document field.
     */
    field: string
    /**
     * Options for handling GeoJSON documents that contain geometries with
     * coordinate dimensions higher than 2.
     */
    options?: number
    /**
     * Require the field to exist (not be `null`).
     * @defaultValue false
     */
    required?: boolean
    /**
     * Unique value used to unambiguously identify projected, unprojected, and
     * local spatial coordinate system definitions.
     */
    srid?: number
    /**
     * Column datatype of the generated virtual column created to accomodate
     * the index.
     */
    type: string
}

/**
 * Index definition object.
 * ```
 * interface IndexDefinition {
 *   fields: object[],
 *   type?: string
 * }
 * ```
 */
export interface IndexDefinition {
    /**
     * List of document fields that compose the index.
     */
    fields: FieldDefinition[]
    /**
     * Type of the index (`INDEX` or `SPATIAL`).
     */
    type?: string
}

/**
 * Collection instance.
 */
interface Collection {
    /**
     * Adds a new document to the collection.
     * @param doc - One or more documents or arrays of documents (plain JavaScript objects or JSON literals).
     * @param docs - Additional documents or arrays of documents.
     * @returns A fluent statement instance.
     */
    add: (doc: CollectionDocuments, ...docs: CollectionDocuments[]) => CollectionAdd
    /**
     * Upserts a document.
     * @param id - The document identifier.
     * @param doc - A plain JavaScript object containing the new document definition.
     * @returns A `Result` instance containing operational details.
     */
    addOrReplaceOne: (id: string, doc: object) => Result
    /**
     * Retrieves the number of documents in the collection.
     * @returns The number of documents in the collection.
     */
    count: () => Promise<number>
    /**
     * Creates an index for one or more fields of documents in the collection.
     * @param name - The index unique name.
     * @param definition - An index definition as specified by `Collection.IndexDefinition.*`.
     * @returns A `Promise` that resolves to a boolean value which is `true`
     * when the index was successfuly created or `false` otherwise.
     */
    createIndex: (name: string, definition: IndexDefinition) => Promise<boolean>
    /**
     * Deletes a collection index.
     * @returns A `Promise` that resolves to a boolean value which is `true`
     * when the index was successfuly deleted or `false` otherwise.
     */
    dropIndex: (name: string) => Promise<boolean>
    /**
     * Checks if the collection is available in the server database.
     * @returns A `Promise` that resolves to a boolean value which is `true`
     * when the collection exists or `false` otherwise.
     */
    existsInDatabase: () => Promise<boolean>
    /**
     * Finds a document (with an optional filtering criteria) in the collection.
     * @param expr - An optional X DevAPI expression that defines the filtering criteria.
     * @returns A fluent statement instance.
     */
    find: (expr?: SearchConditionStr) => CollectionFind
    /**
     * Retrieves the name of the collection.
     * @returns The collection name.
     */
    getName: () => string
    /**
     * Retrieves a single document, with a given id, from the collection.
     * @param id - The document id.
     * @returns The document as a plain JavaScript object.
     */
    getOne: (id: string) => object
    /**
     * Retrieves the instance of the associated schema.
     * @returns The schema instance.
     */
    getSchema: () => Schema
    /**
     * Modifies one or more documents of the collection.
     * @param expr - A mandatory X DevAPI expression that defines the filtering criteria.
     * To modify all documents in the collection, the expression must evaluate to true.
     * Possible values: `'true'`, `'TRUE'` or `'1'`.
     * @returns A fluent statement instance.
     */
    modify: (expr: SearchConditionStr) => CollectionModify
    /**
     * Removes one or more documents from the collection.
     * @param expr - A mandatory X DevAPI expression that defines the filtering criteria.
     * To remove all documents from the collection, the expression must evaluate to true.
     * Possible values: `'true'`, `'TRUE'` or `'1'`.
     * @returns A fluent statement instance.
     */
    remove: (expr: SearchConditionStr) => CollectionRemove
    /**
     * Removes a document, with a given id, from the collection.
     * @param id - The document id.
     * @returns A `Result` instance containing operational details.
     */
    removeOne: (id: string) => Result
    /**
     * Replaces the contents of a document with a given id.
     * @param id - The document id.
     * @param doc - The new document as a plain JavaScript object.
     * @returns A `Result` instance containing operational details.
     */
    replaceOne: (id: string, doc: object) => Result
}

export default Collection;
