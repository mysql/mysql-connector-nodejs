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
import Result from '../../lib/DevAPI/Result';
import TableDelete from '../../lib/DevAPI/TableDelete';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy table
    const table = schema.getTable('foo');
    // create a dummy statement
    const statement = table.delete();

    // bind()
    expectType<TableDelete>(statement.bind('name', 'foo'));
    expectType<TableDelete>(statement.bind('name', 1));
    expectType<TableDelete>(statement.bind('name', 2.2));
    expectType<TableDelete>(statement.bind('name', true));
    expectType<TableDelete>(statement.bind('name', false));
    expectType<TableDelete>(statement.bind('name', new Date()));
    expectType<TableDelete>(statement.bind('name', null));
    expectType<TableDelete>(statement.bind('name', Buffer.from('foo')));
    expectType<TableDelete>(statement.bind('name', BigInt('18446744073709551615')));
    expectType<TableDelete>(statement.bind({ name: 'foo' }));
    expectType<TableDelete>(statement.bind({ name: 1 }));
    expectType<TableDelete>(statement.bind({ name: 2.2 }));
    expectType<TableDelete>(statement.bind({ name: true }));
    expectType<TableDelete>(statement.bind({ name: false }));
    expectType<TableDelete>(statement.bind({ name: new Date() }));
    expectType<TableDelete>(statement.bind({ name: null }));
    expectType<TableDelete>(statement.bind({ name: Buffer.from('foo') }));
    expectType<TableDelete>(statement.bind({ name: BigInt('18446744073709551615') }));

    // execute()
    expectType<Result>(await statement.execute());

    // limit()
    expectType<TableDelete>(statement.limit(3));
    expectType<TableDelete>(statement.limit(BigInt('18446744073709551615')));

    // orderBy()
    expectType<TableDelete>(statement.orderBy('foo ASC'));
    expectType<TableDelete>(statement.orderBy('foo DESC'));
    expectType<TableDelete>(statement.orderBy('foo asc'));
    expectType<TableDelete>(statement.orderBy('foo desc'));
    expectType<TableDelete>(statement.orderBy('foo ASC', 'bar DESC'));
    expectType<TableDelete>(statement.orderBy('foo DESC', 'bar ASC'));
    expectType<TableDelete>(statement.orderBy('foo asc', 'bar desc'));
    expectType<TableDelete>(statement.orderBy('foo desc', 'bar asc'));
    expectType<TableDelete>(statement.orderBy(['foo ASC', 'bar DESC']));
    expectType<TableDelete>(statement.orderBy(['foo DESC', 'bar ASC']));
    expectType<TableDelete>(statement.orderBy(['foo asc', 'bar desc']));
    expectType<TableDelete>(statement.orderBy(['foo desc', 'bar asc']));

    // where()
    expectType<TableDelete>(statement.where('foo'));
    expectType<TableDelete>(statement.where(mysqlx.expr('foo')));
}

void test();
