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
import CollectionModify from '../../lib/DevAPI/CollectionModify';
import Result from '../../lib/DevAPI/Result';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy collection
    const collection = schema.getCollection('foo');
    // create a dummy statement
    const statement = collection.modify('true');

    // arrayAppend()
    expectType<CollectionModify>(statement.arrayAppend('foo', 'bar'));
    expectType<CollectionModify>(statement.arrayAppend('foo', 1));
    expectType<CollectionModify>(statement.arrayAppend('foo', 2.2));
    expectType<CollectionModify>(statement.arrayAppend('foo', true));
    expectType<CollectionModify>(statement.arrayAppend('foo', false));
    expectType<CollectionModify>(statement.arrayAppend('foo', new Date()));
    expectType<CollectionModify>(statement.arrayAppend('foo', Buffer.from('bar')));
    expectType<CollectionModify>(statement.arrayAppend('foo', mysqlx.expr('bar')));
    expectType<CollectionModify>(statement.arrayAppend('foo', BigInt('18446744073709551615')));

    // arrayInsert()
    expectType<CollectionModify>(statement.arrayInsert('foo', 'bar'));
    expectType<CollectionModify>(statement.arrayInsert('foo', 1));
    expectType<CollectionModify>(statement.arrayInsert('foo', 2.2));
    expectType<CollectionModify>(statement.arrayInsert('foo', true));
    expectType<CollectionModify>(statement.arrayInsert('foo', false));
    expectType<CollectionModify>(statement.arrayInsert('foo', new Date()));
    expectType<CollectionModify>(statement.arrayInsert('foo', Buffer.from('bar')));
    expectType<CollectionModify>(statement.arrayInsert('foo', mysqlx.expr('bar')));
    expectType<CollectionModify>(statement.arrayInsert('foo', BigInt('18446744073709551615')));

    // bind()
    expectType<CollectionModify>(statement.bind('name', 'foo'));
    expectType<CollectionModify>(statement.bind('name', 1));
    expectType<CollectionModify>(statement.bind('name', 2.2));
    expectType<CollectionModify>(statement.bind('name', true));
    expectType<CollectionModify>(statement.bind('name', false));
    expectType<CollectionModify>(statement.bind('name', new Date()));
    expectType<CollectionModify>(statement.bind('name', null));
    expectType<CollectionModify>(statement.bind('name', Buffer.from('foo')));
    expectType<CollectionModify>(statement.bind('name', BigInt('18446744073709551615')));
    expectType<CollectionModify>(statement.bind({ name: 'foo' }));
    expectType<CollectionModify>(statement.bind({ name: 1 }));
    expectType<CollectionModify>(statement.bind({ name: 2.2 }));
    expectType<CollectionModify>(statement.bind({ name: true }));
    expectType<CollectionModify>(statement.bind({ name: false }));
    expectType<CollectionModify>(statement.bind({ name: new Date() }));
    expectType<CollectionModify>(statement.bind({ name: null }));
    expectType<CollectionModify>(statement.bind({ name: Buffer.from('foo') }));
    expectType<CollectionModify>(statement.bind({ name: BigInt('18446744073709551615') }));

    // execute()
    expectType<Result>(await statement.execute());

    // limit()
    expectType<CollectionModify>(statement.limit(3));
    expectType<CollectionModify>(statement.limit(BigInt('18446744073709551615')));

    // patch()
    expectType<CollectionModify>(statement.patch({ name: 'foo' }));
    expectType<CollectionModify>(statement.patch({ name: null }));
    expectType<CollectionModify>(statement.patch({ name: BigInt('18446744073709551615') }));
    expectType<CollectionModify>(statement.patch({ child: { name: 'foo' } }));
    expectType<CollectionModify>(statement.patch({ children: [{ name: 'foo' }] }));
    expectType<CollectionModify>(statement.patch('{ "name": "foo" }'));
    expectType<CollectionModify>(statement.patch('{ "name": null }'));
    expectType<CollectionModify>(statement.patch('{ "child": { "name": "foo" } }'));
    expectType<CollectionModify>(statement.patch('{ "children": [{ "name": "foo" }] }'));

    // set()
    expectType<CollectionModify>(statement.set('foo', 'bar'));
    expectType<CollectionModify>(statement.set('foo', 1));
    expectType<CollectionModify>(statement.set('foo', 2.2));
    expectType<CollectionModify>(statement.set('foo', true));
    expectType<CollectionModify>(statement.set('foo', false));
    expectType<CollectionModify>(statement.set('foo', new Date()));
    expectType<CollectionModify>(statement.set('foo', Buffer.from('bar')));
    expectType<CollectionModify>(statement.set('foo', mysqlx.expr('bar')));
    expectType<CollectionModify>(statement.set('foo', BigInt('18446744073709551615')));

    // sort()
    expectType<CollectionModify>(statement.sort('foo ASC'));
    expectType<CollectionModify>(statement.sort('foo DESC'));
    expectType<CollectionModify>(statement.sort('foo asc'));
    expectType<CollectionModify>(statement.sort('foo desc'));
    expectType<CollectionModify>(statement.sort('foo ASC', 'bar DESC'));
    expectType<CollectionModify>(statement.sort('foo DESC', 'bar ASC'));
    expectType<CollectionModify>(statement.sort('foo asc', 'bar desc'));
    expectType<CollectionModify>(statement.sort('foo desc', 'bar asc'));
    expectType<CollectionModify>(statement.sort(['foo ASC', 'bar DESC']));
    expectType<CollectionModify>(statement.sort(['foo DESC', 'bar ASC']));
    expectType<CollectionModify>(statement.sort(['foo asc', 'bar desc']));
    expectType<CollectionModify>(statement.sort(['foo desc', 'bar asc']));

    // unset()
    expectType<CollectionModify>(statement.unset('foo'));
    expectType<CollectionModify>(statement.unset(['foo']));
    expectType<CollectionModify>(statement.unset(['foo', 'bar']));
}

void test();
