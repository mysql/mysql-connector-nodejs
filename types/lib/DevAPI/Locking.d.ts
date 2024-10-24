/*
 * Copyright (c) 2022, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

type DEFAULT = 0;
type NOWAIT = 1;
type SKIP_LOCKED = 2;

/**
 * Allowed options to handle hot row contention.
 */
type LockContention = DEFAULT | NOWAIT | SKIP_LOCKED;

interface Locking<ReturnType> {
    /**
     * Assigns an exclusive lock to the underlying transaction.
     * @param mode - A number that identifies the modifier used to manage hot row
     * contention, as defined by `mysqlx.LockContention.*`.
     * @returns The current statement instance itself.
     */
    lockExclusive: (mode?: LockContention) => ReturnType
    /**
     * Assigns a shared lock to the underlying transaction.
     * @param mode - A number that identifies the modifier used to manage hot row
     * contention, as defined by `mysqlx.LockContention.*`.
     * @returns The current statement instance itself.
     */
    lockShared: (mode?: LockContention) => ReturnType
}

export default Locking;
