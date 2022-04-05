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

/**
 * Column instance of each item in the result set.
 */
interface Column {
    /**
     * Retrieves the character set used by the column.
     * @returns The name of the character set.
     */
    getCharacterSetName: () => string
    /**
     * Retrieves the collation used by the column.
     * @returns The name of the collation.
     */
    getCollationName: () => string
    /**
     * Retrieves a potential alias created for the column.
     * @returns The column alias.
     */
    getColumnLabel: () => string
    /**
     * Retrieves the actual name of the column.
     * @returns The column name.
     */
    getColumnName: () => string
    /**
     * Retrieves the number of fractional digits allowed for the column
     * (DECIMAL or similar types).
     * @returns The number of fractional digits.
     */
    getFractionalDigits: () => number
    /**
     * Retrieves the allowed size of the column in the schema.
     * @returns The total size of the column.
     */
    getLength: () => number
    /**
     * Retrieves the name of the schema where the table belongs to.
     * @returns The schema name.
     */
    getSchemaName: () => string
    /**
     * Retrieves a potential alias of the table where the column belongs to.
     * @returns The table alias.
     */
    getTableLabel: () => string
    /**
     * Retrieves the actual name of the table where the column belongs to.
     * @returns The table name.
     */
    getTableName: () => string
    /**
     * Retrieves the name of the X DevAPI type assigned to the column.
     * @returns The X DevAPI type name.
     */
    getType: () => string
    /**
     * Checks if the column value is signed or not (for INT or similar types).
     * @returns A boolean that is `true` if the value is `SIGNED` or `false`
     * if it is `UNSIGNED`.
     */
    isNumberSigned: () => boolean
    /**
     * Checks if the column value is being padded.
     * @returns A boolean that is `true` if the value is being padded or
     * `false` if not.
     */
    isPadded: () => boolean
}

export default Column;
