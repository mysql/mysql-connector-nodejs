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

import { expectType } from 'tsd';
import * as mysqlx from '../../';
import Schema from '../../lib/DevAPI/Schema';
import TableDelete from '../../lib/DevAPI/TableDelete';
import TableInsert from '../../lib/DevAPI/TableInsert';
import TableSelect from '../../lib/DevAPI/TableSelect';
import TableUpdate from '../../lib/DevAPI/TableUpdate';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy collection
    const table = schema.getTable('foo');

    // count()
    expectType<number>(await table.count());

    // delete()
    expectType<TableDelete>(table.delete());

    // existsInDatabase()
    expectType<boolean>(await table.existsInDatabase());

    // getName()
    expectType<string>(table.getName());

    // getSchema()
    expectType<Schema>(table.getSchema());

    // insert()
    expectType<TableInsert>(table.insert('foo'));
    expectType<TableInsert>(table.insert('foo', 'bar'));
    expectType<TableInsert>(table.insert(['foo']));
    expectType<TableInsert>(table.insert(['foo', 'bar']));

    // isView()
    expectType<boolean>(await table.isView());

    // select()
    expectType<TableSelect>(table.select());
    // using string arguments
    expectType<TableSelect>(table.select('foo'));
    expectType<TableSelect>(table.select('foo as bar'));
    expectType<TableSelect>(table.select('foo', 'bar'));
    expectType<TableSelect>(table.select(['foo']));
    expectType<TableSelect>(table.select(['foo', 'bar']));
    // using Expr arguments
    expectType<TableSelect>(table.select(mysqlx.expr('foo')));
    expectType<TableSelect>(table.select(mysqlx.expr('foo as bar')));
    expectType<TableSelect>(table.select(mysqlx.expr('foo'), mysqlx.expr('bar')));
    expectType<TableSelect>(table.select([mysqlx.expr('foo')]));
    expectType<TableSelect>(table.select([mysqlx.expr('foo'), mysqlx.expr('bar')]));

    // update()
    expectType<TableUpdate>(table.update());
}

void test();
