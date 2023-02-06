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
import CollectionFind from '../../lib/DevAPI/CollectionFind';
import DocResult from '../../lib/DevAPI/DocResult';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy collection
    const collection = schema.getCollection('foo');
    // create a dummy statement
    const statement = collection.find();

    // bind()
    expectType<CollectionFind>(statement.bind('name', 'foo'));
    expectType<CollectionFind>(statement.bind('name', 1));
    expectType<CollectionFind>(statement.bind('name', 2.2));
    expectType<CollectionFind>(statement.bind('name', true));
    expectType<CollectionFind>(statement.bind('name', false));
    expectType<CollectionFind>(statement.bind('name', new Date()));
    expectType<CollectionFind>(statement.bind('name', null));
    expectType<CollectionFind>(statement.bind('name', Buffer.from('foo')));
    expectType<CollectionFind>(statement.bind('name', BigInt('18446744073709551615')));
    expectType<CollectionFind>(statement.bind({ name: 'foo' }));
    expectType<CollectionFind>(statement.bind({ name: 1 }));
    expectType<CollectionFind>(statement.bind({ name: 2.2 }));
    expectType<CollectionFind>(statement.bind({ name: true }));
    expectType<CollectionFind>(statement.bind({ name: false }));
    expectType<CollectionFind>(statement.bind({ name: new Date() }));
    expectType<CollectionFind>(statement.bind({ name: null }));
    expectType<CollectionFind>(statement.bind({ name: Buffer.from('foo') }));
    expectType<CollectionFind>(statement.bind({ name: BigInt('18446744073709551615') }));

    // execute()
    expectType<DocResult>(await statement.execute());

    // fields()
    expectType<CollectionFind>(statement.fields('foo'));
    expectType<CollectionFind>(statement.fields('foo', 'bar'));
    expectType<CollectionFind>(statement.fields(['foo']));
    expectType<CollectionFind>(statement.fields(['foo', 'bar']));
    expectType<CollectionFind>(statement.fields(mysqlx.expr('foo')));
    expectType<CollectionFind>(statement.fields(mysqlx.expr('foo'), mysqlx.expr('bar')));
    expectType<CollectionFind>(statement.fields([mysqlx.expr('foo')]));
    expectType<CollectionFind>(statement.fields([mysqlx.expr('foo'), mysqlx.expr('bar')]));

    // groupBy()
    expectType<CollectionFind>(statement.groupBy('foo'));
    expectType<CollectionFind>(statement.groupBy('foo', 'bar'));
    expectType<CollectionFind>(statement.groupBy(['foo']));
    expectType<CollectionFind>(statement.groupBy(['foo', 'bar']));
    expectType<CollectionFind>(statement.groupBy(mysqlx.expr('foo')));
    expectType<CollectionFind>(statement.groupBy(mysqlx.expr('foo'), mysqlx.expr('bar')));
    expectType<CollectionFind>(statement.groupBy([mysqlx.expr('foo')]));
    expectType<CollectionFind>(statement.groupBy([mysqlx.expr('foo'), mysqlx.expr('bar')]));

    // having()
    expectType<CollectionFind>(statement.having('foo'));
    expectType<CollectionFind>(statement.having(mysqlx.expr('foo')));

    // limit()
    expectType<CollectionFind>(statement.limit(3));
    expectType<CollectionFind>(statement.limit(BigInt('18446744073709551615')));

    // lockExclusive()
    expectType<CollectionFind>(statement.lockExclusive());
    expectType<CollectionFind>(statement.lockExclusive(mysqlx.LockContention.DEFAULT));
    expectType<CollectionFind>(statement.lockExclusive(mysqlx.LockContention.NOWAIT));
    expectType<CollectionFind>(statement.lockExclusive(mysqlx.LockContention.SKIP_LOCKED));

    // lockShared()
    expectType<CollectionFind>(statement.lockShared());
    expectType<CollectionFind>(statement.lockShared(mysqlx.LockContention.DEFAULT));
    expectType<CollectionFind>(statement.lockShared(mysqlx.LockContention.NOWAIT));
    expectType<CollectionFind>(statement.lockShared(mysqlx.LockContention.SKIP_LOCKED));

    // offset()
    expectType<CollectionFind>(statement.offset(3));
    expectType<CollectionFind>(statement.offset(BigInt('18446744073709551615')));

    // sort()
    expectType<CollectionFind>(statement.sort('foo ASC'));
    expectType<CollectionFind>(statement.sort('foo DESC'));
    expectType<CollectionFind>(statement.sort('foo asc'));
    expectType<CollectionFind>(statement.sort('foo desc'));
    expectType<CollectionFind>(statement.sort('foo ASC', 'bar DESC'));
    expectType<CollectionFind>(statement.sort('foo DESC', 'bar ASC'));
    expectType<CollectionFind>(statement.sort('foo asc', 'bar desc'));
    expectType<CollectionFind>(statement.sort('foo desc', 'bar asc'));
    expectType<CollectionFind>(statement.sort(['foo ASC', 'bar DESC']));
    expectType<CollectionFind>(statement.sort(['foo DESC', 'bar ASC']));
    expectType<CollectionFind>(statement.sort(['foo asc', 'bar desc']));
    expectType<CollectionFind>(statement.sort(['foo desc', 'bar asc']));
}

void test();
