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

import { Scalar } from '../Protocol/Datatypes';

/**
 * Object where each field represents a named placeholder specified by the
 * statement and is assigned the corresponding scalar value.
 * As specified by the [PlaceholderValues](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-placeholdervalues)
 * EBNF definition.
 */
export interface PlaceholderValues {
    [key: string]: Scalar
}

/**
 * Mixin type used by statements that support named placeholders.
 */
interface Binding<ReturnType> {
    /**
     * Binds values to existing statement placeholders.
     * @typeParam T - A string with the placeholder name or an object
     * mapping placeholder names to values.
     * @returns The current statement instance itself.
     */
    bind: <T extends string | PlaceholderValues>(value: T, assignment?: T extends string ? Scalar : never) => ReturnType
}

export default Binding;
