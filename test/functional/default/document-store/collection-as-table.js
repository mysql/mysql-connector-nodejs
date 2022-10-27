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

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const { expect } = require('chai');

describe('finding documents in collections using CRUD with a table API', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session, collection;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create session using default schema', () => {
        const defaultConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('BUG#31017606 inconsistent JSON_UNQUOTE syntax', () => {
        beforeEach('add fixtures', () => {
            return collection.add({ name: 'foo', age: 42, enabled: true, nullable: null }).execute();
        });

        it('returns a consistent result in table mode', () => {
            const fields = ["doc->>'$.name'", "doc->>'$.age'", "doc->>'$.enabled'", "doc->>'$.nullable'"];
            const sql = `select ${fields.join(',')} from \`${schema.getName()}\`.\`${collection.getName()}\``;
            const table = schema.getCollectionAsTable(collection.getName());

            return Promise.all([session.sql(sql).execute(), table.select(fields).execute()])
                .then(([res1, res2]) => {
                    return expect(res1.fetchOne()).to.deep.equal(res2.fetchOne()).to.deep.equal(['foo', '42', 'true', 'null']);
                });
        });
    });

    context('BUG#34728259', () => {
        const id = '1';
        const signedBigInt = '-9223372036854775808';
        const unsignedBigInt = '18446744073709551615';

        beforeEach('populate collection', () => {
            return session.sql(`INSERT INTO \`${schema.getName()}\`.\`${collection.getName()}\` (doc) VALUES ('{ "_id": "${id}", "signedBigInt": ${signedBigInt}, "unsignedBigInt": ${unsignedBigInt} }')`)
                .execute();
        });

        it('returns unsafe numeric field values as strings', () => {
            return schema.getCollectionAsTable(collection.getName())
                .select('doc')
                .execute()
                .then(res => {
                    return expect(res.fetchOne()).to.deep.equal([{ _id: id, signedBigInt, unsignedBigInt }]);
                });
        });
    });
});
