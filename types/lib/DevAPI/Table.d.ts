/*
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
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

import { TableFields } from './Filtering';
import { ProjectedSearchExprStrList } from './Projecting';
import Schema from './Schema';
import TableDelete from './TableDelete';
import TableInsert from './TableInsert';
import TableSelect from './TableSelect';
import TableUpdate from './TableUpdate';

interface Table {
    /**
     * Retrieves the number of rows in the table.
     * @returns The number of rows in the table.
     * */
    count: () => Promise<number>
    /**
     * Creates a statement to deletes rows from the table.
     * @returns A fluent statement instance.
     * */
    delete: () => TableDelete
    /**
     * Checks if the table is available in the server database.
     * @returns A boolean value which is `true` if the table exists or `false` otherwise.
     */
    existsInDatabase: () => Promise<boolean>
    /**
     * Retrieves the name of the collection.
     * @returns The collection name.
     */
    getName: () => string
    /**
     * Retrieves the instance of the associated schema.
     * @returns The schema instance.
     */
    getSchema: () => Schema
    /**
     * Creates a statement to insert one or more rows in the table.
     * @param fields - The list of table columns to fill.
     * @returns A fluent statement instance.
     */
    insert: (field: TableFields, ...fields: TableFields[]) => TableInsert
    /**
     * Checks if the table is a `VIEW`.
     * @returns A `Promise` that resolves to boolean value which is `true` if
     * the table is a `VIEW` or false otherwise.
     */
    isView: () => Promise<boolean>
    /**
     * Creates a statement to select rows from the table.
     * @returns A fluent statement instance.
     */
    select: (projectedSearchExprStr?: ProjectedSearchExprStrList, ...projectedSearchExprStrList: ProjectedSearchExprStrList[]) => TableSelect
    /**
     * Creates a statement to update rows in the table.
     * @returns A fluent statement instance.
     */
    update: () => TableUpdate
}

export default Table;
