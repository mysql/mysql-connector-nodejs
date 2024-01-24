/*
 * Copyright (c) 2022, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const mysqlx = require('../index');
const config = require('../test/config');

const schemaName = config.schema || 'mysql-connector-nodejs_benchmark';
const tableName = 'benchmark_prepared_table_select';
const times = parseInt(process.argv[2]) || 10000;
const label = `prepared-table-select benchmark (${times} times)`;

const records = [{
    firstName: 'foo',
    lastName: 'bar',
    age: 42
}, {
    firstName: 'foo',
    lastName: 'baz',
    age: 50
}, {
    firstName: 'baz',
    lastName: 'qux',
    age: 31
}, {
    firstName: 'qux',
    lastName: 'quux',
    age: 40
}];

const benchmark = async () => {
    let session;

    try {
        session = await mysqlx.getSession(config);

        await session.sql(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\``)
            .execute();
        await session.sql(`CREATE TABLE IF NOT EXISTS \`${schemaName}\`.${tableName} (firstName VARCHAR(5), lastName VARCHAR(5), age TINYINT)`)
            .execute();

        const table = session.getSchema(schemaName).getTable(tableName);
        let statement = table.insert('firstName', 'lastName', 'age');

        records.forEach(r => {
            statement.values(r.firstName, r.lastName, r.age);
        });

        await statement.execute();

        const tests = [...Array(times)].map((_, i) => records[i % records.length].firstName);

        console.time(label);
        statement = table.select(mysqlx.expr('{ "name": concat(firstName, lastName), "year": year(curdate()) - age }'))
            .where('firstName = :name')
            .orderBy('age ASC');

        await Promise.allSettled(tests.map(test => statement.bind('name', test).execute()));
        console.timeEnd(label);
    } finally {
        if (session) {
            await session.sql(`DROP DATABASE IF EXISTS \`${schemaName}\``).execute();
            await session.close();
        }
    }
};

benchmark();
