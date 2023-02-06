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
import CollectionRemove from '../../lib/DevAPI/CollectionRemove';
import Result from '../../lib/DevAPI/Result';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy collection
    const collection = schema.getCollection('foo');
    // create a dummy statement
    const statement = collection.remove('foo');

    // bind()
    expectType<CollectionRemove>(statement.bind('name', 'foo'));
    expectType<CollectionRemove>(statement.bind('name', 1));
    expectType<CollectionRemove>(statement.bind('name', 2.2));
    expectType<CollectionRemove>(statement.bind('name', true));
    expectType<CollectionRemove>(statement.bind('name', false));
    expectType<CollectionRemove>(statement.bind('name', new Date()));
    expectType<CollectionRemove>(statement.bind('name', null));
    expectType<CollectionRemove>(statement.bind('name', Buffer.from('foo')));
    expectType<CollectionRemove>(statement.bind('name', BigInt('18446744073709551615')));
    expectType<CollectionRemove>(statement.bind({ name: 'foo' }));
    expectType<CollectionRemove>(statement.bind({ name: 1 }));
    expectType<CollectionRemove>(statement.bind({ name: 2.2 }));
    expectType<CollectionRemove>(statement.bind({ name: true }));
    expectType<CollectionRemove>(statement.bind({ name: false }));
    expectType<CollectionRemove>(statement.bind({ name: new Date() }));
    expectType<CollectionRemove>(statement.bind({ name: null }));
    expectType<CollectionRemove>(statement.bind({ name: Buffer.from('foo') }));
    expectType<CollectionRemove>(statement.bind({ name: BigInt('18446744073709551615') }));

    // execute()
    expectType<Result>(await statement.execute());

    // limit()
    expectType<CollectionRemove>(statement.limit(3));

    // sort()
    expectType<CollectionRemove>(statement.sort('foo ASC'));
    expectType<CollectionRemove>(statement.sort('foo DESC'));
    expectType<CollectionRemove>(statement.sort('foo asc'));
    expectType<CollectionRemove>(statement.sort('foo desc'));
    expectType<CollectionRemove>(statement.sort('foo ASC', 'bar DESC'));
    expectType<CollectionRemove>(statement.sort('foo DESC', 'bar ASC'));
    expectType<CollectionRemove>(statement.sort('foo asc', 'bar desc'));
    expectType<CollectionRemove>(statement.sort('foo desc', 'bar asc'));
    expectType<CollectionRemove>(statement.sort(['foo ASC', 'bar DESC']));
    expectType<CollectionRemove>(statement.sort(['foo DESC', 'bar ASC']));
    expectType<CollectionRemove>(statement.sort(['foo asc', 'bar desc']));
    expectType<CollectionRemove>(statement.sort(['foo desc', 'bar asc']));
}

void test();
