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

import Client, { Options as ClientOptions } from './lib/DevAPI/Client';
import Collection from './lib/DevAPI/Collection';
import CollectionAdd, { CollectionDocuments, DocumentOrJSON } from './lib/DevAPI/CollectionAdd';
import CollectionFind, { ProjectedDocumentExprStr, ProjectedDocumentExprStrList } from './lib/DevAPI/CollectionFind';
import CollectionModify from './lib/DevAPI/CollectionModify';
import CollectionRemove from './lib/DevAPI/CollectionRemove';
import Column from './lib/DevAPI/Column';
import DocResult, { Document } from './lib/DevAPI/DocResult';
import Result from './lib/DevAPI/Result';
import RowResult from './lib/DevAPI/RowResult';
import SqlResult from './lib/DevAPI/SqlResult';
import Table from './lib/DevAPI/Table';
import TableInsert from './lib/DevAPI/TableInsert';
import TableDelete from './lib/DevAPI/TableDelete';
import TableSelect from './lib/DevAPI/TableSelect';
import TableUpdate from './lib/DevAPI/TableUpdate';
import Schema, { CreateCollectionOptions, ValidationOptions } from './lib/DevAPI/Schema';
import Session from './lib/DevAPI/Session';
import { Expr } from './lib/DevAPI/Expr';
import { Options as ConnectionOptions } from './lib/DevAPI/Connection';
import { Options as PoolingOptions } from './lib/DevAPI/ConnectionPool';
import { Type } from './lib/DevAPI/Query';

/**
 * X DevAPI expression parser options.
 * ```
 * interface {
 *   mode: number
 * }
 * ```
 */
interface ParserOptions {
    /**
     * Parser mode for column identifiers and document paths, as defined by `mysqlx.Mode.*`.
     * @defaultValue `mysqlx.Mode.DOCUMENT`
     */
    mode?: Type
}

/**
 * All the top-level types are exposed under `mysqlx.*`.
 */
export { Any, Scalar } from './lib/Protocol/Datatypes';
export { ExprOrLiteral } from './lib/DevAPI/Updating';
export { Literal } from './lib/DevAPI/Statement';
export { SearchConditionStr, SearchExprStr, SearchExprStrList, TableField } from './lib/DevAPI/Filtering';
export { SortExprStr, SortExprStrList } from './lib/DevAPI/Ordering';

export {
    Client,
    ClientOptions,
    Collection,
    CollectionAdd,
    CollectionDocuments,
    CollectionFind,
    CollectionModify,
    CollectionRemove,
    Column,
    ConnectionOptions,
    CreateCollectionOptions,
    DocResult,
    Document,
    DocumentOrJSON,
    Expr,
    ParserOptions,
    PoolingOptions,
    ProjectedDocumentExprStr,
    ProjectedDocumentExprStrList,
    Result,
    RowResult,
    SqlResult,
    // Schema should be a type exposed as `mysqlx.Schema`.
    // eslint-disable-next-line import/export
    Schema,
    Session,
    Table,
    TableDelete,
    TableInsert,
    TableSelect,
    TableUpdate,
    ValidationOptions
};

/**
 * Conversion mode to handle downstream integer values.
 */
export const enum IntegerType {
    BIGINT = 'bigint',
    STRING = 'string',
    UNSAFE_BIGINT = 'unsafe_bigint',
    UNSAFE_STRING = 'unsafe_string'
}

/**
 * Parser mode selector.
 */
export const enum Mode {
    TABLE = 0,
    DOCUMENT = 1
}

/**
 * Hot row contention management options.
 */
export const enum LockContention {
    DEFAULT = 0,
    NOWAIT = 1,
    SKIP_LOCKED = 2
}

/**
 * Top-level schema namespace.
 */
// Schema should also be a namespace exposed as `mysqlx.Schema`.
// eslint-disable-next-line import/export, @typescript-eslint/no-redeclare
export namespace Schema {
    /**
     * Validation level options.
     */
    export const enum ValidationLevel {
        OFF = 'off',
        STRICT = 'strict'
    }
}

/**
 * Parse an [X DevAPI expression](https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html)
 * string into a structured X Protocol message object.
 * Expression strings can be parsed in `DOCUMENT` mode (default) or `TABLE` mode.
 * @param expression - The X DevAPI expression string.
 * @param options - Additional parser options.
 * @returns An X Protocol message object instance.
 */
export function expr (expression: string, options?: ParserOptions): Expr;

/**
 * Create an X DevAPI session in a standalone database connection.
 * @param connection - A connection string or an object containing the connection configuration options.
 * @returns A `Promise` that resolves to the session instance once the connection is established.
 */
export function getSession (connection: string | ConnectionOptions): Promise<Session>;

/**
 * Create an X DevAPI client instance with support for connection pooling.
 * @param connection - A connection string or an object containing the connection configuration options.
 * @param options - Additional client options.
 * @returns A `Client` instance.
 */
export function getClient (connection: string | ConnectionOptions, options?: ClientOptions): Client;

/**
 * Retrieve the package version.
 * @returns A string containing the package version.
 */
export function getVersion (): string;
