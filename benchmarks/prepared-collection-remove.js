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
const times = parseInt(process.argv[2]) || 10000;
const label = `prepared-collection-remove benchmark (${times} times)`;

const docs = [{
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
        let schema = session.getSchema(schemaName);

        if (!(await schema.existsInDatabase())) {
            schema = await session.createSchema(schemaName);
        }

        const collection = await schema.createCollection('benchmark_prepared_collection_remove', { reuseExisting: true });
        // Add enough documents to be removed by the test (total = $times).
        const enoughDocs = docs.map(JSON.stringify)
            .join(' ')
            .concat(' ')
            .repeat(times / docs.length)
            .trim()
            .split(' ')
            .map(JSON.parse);

        await collection.add(enoughDocs)
            .execute();

        const tests = [...Array(times)].map((_, i) => docs[i % docs.length].firstName);

        console.time(label);
        const statement = collection.remove('firstName = :name')
            .sort('age DESC');

        await Promise.allSettled(tests.map(test => statement.bind('name', test).execute()));
        console.timeEnd(label);
    } finally {
        if (session) {
            await session.dropSchema(schemaName);
            await session.close();
        }
    }
};

benchmark();
