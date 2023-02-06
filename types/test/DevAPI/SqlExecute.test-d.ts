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
import SqlExecute from '../../lib/DevAPI/SqlExecute';
import SqlResult from '../../lib/DevAPI/SqlResult';

async function test (): Promise<void> {
    // create a dummy session
    const session = await mysqlx.getSession('foo');
    // create a dummy statement
    const statement = session.sql('select "foo"');

    // bind()
    expectType<SqlExecute>(statement.bind('foo'));
    expectType<SqlExecute>(statement.bind(1));
    expectType<SqlExecute>(statement.bind(2.2));
    expectType<SqlExecute>(statement.bind(true));
    expectType<SqlExecute>(statement.bind(false));
    expectType<SqlExecute>(statement.bind(new Date()));
    expectType<SqlExecute>(statement.bind(null));
    expectType<SqlExecute>(statement.bind(Buffer.from('foo')));
    expectType<SqlExecute>(statement.bind(BigInt('18446744073709551615')));
    expectType<SqlExecute>(statement.bind('foo', 'bar'));
    expectType<SqlExecute>(statement.bind(1, 2));
    expectType<SqlExecute>(statement.bind(2.2, 3.3));
    expectType<SqlExecute>(statement.bind(true, false));
    expectType<SqlExecute>(statement.bind(new Date(), new Date()));
    expectType<SqlExecute>(statement.bind(null, null));
    expectType<SqlExecute>(statement.bind(Buffer.from('foo'), Buffer.from('bar')));
    expectType<SqlExecute>(statement.bind(BigInt('18446744073709551615'), BigInt('-9223372036854775809')));
    expectType<SqlExecute>(statement.bind(['foo', 'bar']));
    expectType<SqlExecute>(statement.bind([1, 2]));
    expectType<SqlExecute>(statement.bind([2.2, 3.3]));
    expectType<SqlExecute>(statement.bind([true, false]));
    expectType<SqlExecute>(statement.bind([new Date(), new Date()]));
    expectType<SqlExecute>(statement.bind([null, null]));
    expectType<SqlExecute>(statement.bind([Buffer.from('foo'), Buffer.from('bar')]));
    expectType<SqlExecute>(statement.bind([BigInt('18446744073709551615'), BigInt('-9223372036854775809')]));
    expectType<SqlExecute>(statement.bind('foo').bind('bar'));
    expectType<SqlExecute>(statement.bind(1).bind(2));
    expectType<SqlExecute>(statement.bind(2.2).bind(3.3));
    expectType<SqlExecute>(statement.bind(true).bind(false));
    expectType<SqlExecute>(statement.bind(new Date()).bind(new Date()));
    expectType<SqlExecute>(statement.bind(null).bind(null));
    expectType<SqlExecute>(statement.bind(Buffer.from('foo')).bind(Buffer.from('bar')));
    expectType<SqlExecute>(statement.bind('foo').bind(['bar', 'baz']));
    expectType<SqlExecute>(statement.bind(BigInt('18446744073709551615')).bind(BigInt('-9223372036854775809')));

    // execute()
    expectType<SqlResult>(await statement.execute());
}

void test();
