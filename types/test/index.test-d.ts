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

import { readFileSync } from 'fs';
import { expectType } from 'tsd';
import * as mysqlx from '../';
import Client from '../lib/DevAPI/Client';
import Session from '../lib/DevAPI/Session';
import { Expr } from '../lib/DevAPI/Expr';

async function test (): Promise<void> {
    // getSession()
    expectType<Session>(await mysqlx.getSession('foo'));
    expectType<Session>(await mysqlx.getSession({ user: 'foo' }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', auth: 'bar' }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', connectTimeout: 3000 }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', connectionAttributes: { bar: 'baz', qux: 'quux' } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', host: 'bar' }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', password: 'bar' }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', port: 33060 }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', socket: 'bar' }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { enabled: true } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { enabled: false } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { ca: 'bar' } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { ca: readFileSync('bar') } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { ca: [readFileSync('bar'), readFileSync('baz')] } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { crl: 'bar' } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { crl: readFileSync('bar') } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', tls: { crl: [readFileSync('bar'), readFileSync('baz')] } }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', integerType: mysqlx.IntegerType.BIGINT }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', integerType: mysqlx.IntegerType.STRING }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', integerType: mysqlx.IntegerType.UNSAFE_BIGINT }));
    expectType<Session>(await mysqlx.getSession({ user: 'foo', integerType: mysqlx.IntegerType.UNSAFE_STRING }));

    // getClient()
    expectType<Client>(mysqlx.getClient('foo'));
    expectType<Client>(mysqlx.getClient({ user: 'foo' }));
    expectType<Client>(mysqlx.getClient('foo', { pooling: { enabled: true } }));
    expectType<Client>(mysqlx.getClient({ user: 'foo' }, { pooling: { maxIdleTime: 3000 } }));
    expectType<Client>(mysqlx.getClient({ user: 'foo', host: 'bar' }, { pooling: { maxSize: 10 } }));
    expectType<Client>(mysqlx.getClient({ user: 'foo', password: 'bar' }, { pooling: { queueTimeout: 3000 } }));

    // getVersion()
    expectType<string>(mysqlx.getVersion());

    // expr()
    expectType<Expr>(mysqlx.expr('foo'));
    expectType<Expr>(mysqlx.expr('baz', {}));
    expectType<Expr>(mysqlx.expr('bar', { mode: mysqlx.Mode.DOCUMENT }));
    expectType<Expr>(mysqlx.expr('baz', { mode: mysqlx.Mode.TABLE }));
}

void test();
