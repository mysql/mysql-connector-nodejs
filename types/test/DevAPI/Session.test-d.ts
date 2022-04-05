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

import { expectType } from 'tsd';
import * as mysqlx from '../../';
import Schema from '../../lib/DevAPI/Schema';
import SqlExecute from '../../lib/DevAPI/SqlExecute';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');

    // commit()
    expectType(await session.commit());

    // close()
    expectType(await session.close());

    // createSchema()
    expectType<Schema>(await session.createSchema('bar'));

    // dropSchema()
    expectType<boolean>(await session.dropSchema('bar'));

    // getDefaultSchema()
    expectType<Schema>(await session.getDefaultSchema());

    // getSchema()
    expectType<Schema>(session.getSchema('bar'));

    // getSchemas()
    expectType<Schema[]>(await session.getSchemas());

    // releaseSavepoint()
    expectType(await session.releaseSavepoint('baz'));

    // rollback()
    expectType(await session.rollback());

    // rollbackTo()
    expectType(await session.rollbackTo('bar'));

    // setSavepoint()
    expectType<string>(await session.setSavepoint());
    expectType<'bar'>(await session.setSavepoint('bar'));

    // sql()
    expectType<SqlExecute>(await session.sql('baz'));

    // startTransaction()
    expectType(await session.startTransaction());
}

void test();
