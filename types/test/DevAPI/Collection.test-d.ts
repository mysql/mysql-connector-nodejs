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
import CollectionAdd from '../../lib/DevAPI/CollectionAdd';
import CollectionFind from '../../lib/DevAPI/CollectionFind';
import CollectionModify from '../../lib/DevAPI/CollectionModify';
import CollectionRemove from '../../lib/DevAPI/CollectionRemove';
import Result from '../../lib/DevAPI/Result';
import Schema from '../../lib/DevAPI/Schema';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // obtain a dummy schema
    const schema = session.getDefaultSchema();
    // obtain a dummy collection
    const collection = schema.getCollection('foo');

    // add()
    expectType<CollectionAdd>(collection.add('{ "name": "foo" }'));
    expectType<CollectionAdd>(collection.add('{ "name": "foo" }', '{ "name": "bar" }'));
    expectType<CollectionAdd>(collection.add(['{ "name": "foo" }']));
    expectType<CollectionAdd>(collection.add(['{ "name": "foo" }', '{ "name": "bar" }']));
    expectType<CollectionAdd>(collection.add(['{ "name": "foo" }', '{ "name": "bar" }'], '{ "name": "baz" }'));
    expectType<CollectionAdd>(collection.add(['{ "name": "foo" }', '{ "name": "bar" }'], ['{ "name": "baz" }', '{ "name": "qux" }']));
    expectType<CollectionAdd>(collection.add('{ "name": "foo" }').add('{ "name": "bar" }'));
    expectType<CollectionAdd>(collection.add('{ "name": "foo" }', '{ "name": "bar" }').add('{ "name": "baz" }'));
    expectType<CollectionAdd>(collection.add(['{ "name": "foo" }', '{ "name": "bar" }']).add(['{ "name": "baz" }']));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }, { name: 'bar' }));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }, { name: 'bar', child: { name: 'baz' } }));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }, { name: 'bar', children: [{ name: 'baz' }] }));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo', child: { name: 'bar' } }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo', children: [{ name: 'bar' }] }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar', child: { name: 'bar' } }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar', children: [{ name: 'bar' }] }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }], { name: 'baz' }));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }], [{ name: 'baz' }, { name: 'qux' }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }], [{ name: 'baz' }, { name: 'qux', child: { name: 'quxx' } }]));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }], [{ name: 'baz' }, { name: 'qux', children: [{ name: 'quxx' }] }]));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }).add({ name: 'bar' }));
    expectType<CollectionAdd>(collection.add({ name: 'foo' }, { name: 'bar' }).add({ name: 'baz' }));
    expectType<CollectionAdd>(collection.add([{ name: 'foo' }, { name: 'bar' }]).add([{ name: 'baz' }]));

    // add() using JavaScript class instances
    class Doc {
        private readonly _name: string;

        constructor (name: string) {
            this._name = name;
        }
    }

    expectType<CollectionAdd>(collection.add(new Doc('foo')));
    expectType<CollectionAdd>(collection.add(new Doc('foo'), new Doc('bar')));
    expectType<CollectionAdd>(collection.add([new Doc('foo'), new Doc('bar')]));
    expectType<CollectionAdd>(collection.add([new Doc('foo'), new Doc('bar')], [new Doc('baz')]));

    // addOrReplaceOne()
    expectType<Result>(await collection.addOrReplaceOne('1', { name: 'foo' }));

    // count()
    expectType<number>(await collection.count());

    // createIndex()
    expectType<boolean>(await collection.createIndex('foo', { fields: [{ field: 'bar', type: 'baz' }] }));
    expectType<boolean>(await collection.createIndex('foo', { type: 'index', fields: [{ field: 'baz', type: 'qux' }] }));
    expectType<boolean>(await collection.createIndex('foo', { type: 'bar', fields: [{ field: 'baz', type: 'qux', required: true }] }));
    expectType<boolean>(await collection.createIndex('foo', { type: 'bar', fields: [{ field: 'baz', type: 'qux', required: false, options: 2 }] }));
    expectType<boolean>(await collection.createIndex('foo', { type: 'bar', fields: [{ field: 'baz', type: 'qux', required: true, options: 10, srid: 20 }] }));

    // dropIndex()
    expectType<boolean>(await collection.dropIndex('foo'));

    // existsInDatabase()
    expectType<boolean>(await collection.existsInDatabase());

    // find()
    expectType<CollectionFind>(collection.find());
    expectType<CollectionFind>(collection.find('foo'));
    expectType<CollectionFind>(collection.find(mysqlx.expr('foo')));

    // getName()
    expectType<string>(collection.getName());

    // getSchema()
    expectType<Schema>(collection.getSchema());

    // getOne()
    expectType<object>(await collection.getOne('1'));

    // modify()
    expectType<CollectionModify>(await collection.modify('foo'));
    expectType<CollectionModify>(await collection.modify(mysqlx.expr('foo')));

    // remove()
    expectType<CollectionRemove>(await collection.remove('foo'));
    expectType<CollectionRemove>(await collection.remove(mysqlx.expr('foo')));

    // removeOne()
    expectType<Result>(await collection.removeOne('1'));

    // replaceOne()
    expectType<Result>(await collection.replaceOne('1', { name: 'foo' }));
}

void test();
