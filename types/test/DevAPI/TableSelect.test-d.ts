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
import RowResult from '../../lib/DevAPI/RowResult';
import TableSelect from '../../lib/DevAPI/TableSelect';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy table
    const table = schema.getTable('foo');
    // create a dummy statement
    const statement = table.select();

    // bind()
    expectType<TableSelect>(statement.bind('name', 'foo'));
    expectType<TableSelect>(statement.bind('name', 1));
    expectType<TableSelect>(statement.bind('name', 2.2));
    expectType<TableSelect>(statement.bind('name', true));
    expectType<TableSelect>(statement.bind('name', false));
    expectType<TableSelect>(statement.bind('name', new Date()));
    expectType<TableSelect>(statement.bind('name', null));
    expectType<TableSelect>(statement.bind('name', Buffer.from('foo')));
    expectType<TableSelect>(statement.bind('name', BigInt('18446744073709551615')));
    expectType<TableSelect>(statement.bind({ name: 'foo' }));
    expectType<TableSelect>(statement.bind({ name: 1 }));
    expectType<TableSelect>(statement.bind({ name: 2.2 }));
    expectType<TableSelect>(statement.bind({ name: true }));
    expectType<TableSelect>(statement.bind({ name: false }));
    expectType<TableSelect>(statement.bind({ name: new Date() }));
    expectType<TableSelect>(statement.bind({ name: null }));
    expectType<TableSelect>(statement.bind({ name: Buffer.from('foo') }));
    expectType<TableSelect>(statement.bind({ name: BigInt('18446744073709551615') }));

    // execute()
    expectType<RowResult>(await statement.execute());

    // groupBy()
    expectType<TableSelect>(statement.groupBy('foo'));
    expectType<TableSelect>(statement.groupBy('foo', 'bar'));
    expectType<TableSelect>(statement.groupBy(['foo']));
    expectType<TableSelect>(statement.groupBy(['foo', 'bar']));
    expectType<TableSelect>(statement.groupBy(mysqlx.expr('foo')));
    expectType<TableSelect>(statement.groupBy(mysqlx.expr('foo'), mysqlx.expr('bar')));
    expectType<TableSelect>(statement.groupBy([mysqlx.expr('foo')]));
    expectType<TableSelect>(statement.groupBy([mysqlx.expr('foo'), mysqlx.expr('bar')]));

    // having()
    expectType<TableSelect>(statement.having('foo'));
    expectType<TableSelect>(statement.having(mysqlx.expr('foo')));

    // limit()
    expectType<TableSelect>(statement.limit(3));
    expectType<TableSelect>(statement.limit(BigInt('18446744073709551615')));

    // lockExclusive()
    expectType<TableSelect>(statement.lockExclusive());
    expectType<TableSelect>(statement.lockExclusive(mysqlx.LockContention.DEFAULT));
    expectType<TableSelect>(statement.lockExclusive(mysqlx.LockContention.NOWAIT));
    expectType<TableSelect>(statement.lockExclusive(mysqlx.LockContention.SKIP_LOCKED));

    // lockShared()
    expectType<TableSelect>(statement.lockShared());
    expectType<TableSelect>(statement.lockShared(mysqlx.LockContention.DEFAULT));
    expectType<TableSelect>(statement.lockShared(mysqlx.LockContention.NOWAIT));
    expectType<TableSelect>(statement.lockShared(mysqlx.LockContention.SKIP_LOCKED));

    // orderBy()
    expectType<TableSelect>(statement.orderBy('foo ASC'));
    expectType<TableSelect>(statement.orderBy('foo DESC'));
    expectType<TableSelect>(statement.orderBy('foo asc'));
    expectType<TableSelect>(statement.orderBy('foo desc'));
    expectType<TableSelect>(statement.orderBy('foo ASC', 'bar DESC'));
    expectType<TableSelect>(statement.orderBy('foo DESC', 'bar ASC'));
    expectType<TableSelect>(statement.orderBy('foo asc', 'bar desc'));
    expectType<TableSelect>(statement.orderBy('foo desc', 'bar asc'));
    expectType<TableSelect>(statement.orderBy(['foo ASC', 'bar DESC']));
    expectType<TableSelect>(statement.orderBy(['foo DESC', 'bar ASC']));
    expectType<TableSelect>(statement.orderBy(['foo asc', 'bar desc']));
    expectType<TableSelect>(statement.orderBy(['foo desc', 'bar asc']));

    // offset()
    expectType<TableSelect>(statement.offset(3));
    expectType<TableSelect>(statement.offset(BigInt('18446744073709551615')));

    // where()
    expectType<TableSelect>(statement.where('foo'));
    expectType<TableSelect>(statement.where(mysqlx.expr('foo')));
}

void test();
