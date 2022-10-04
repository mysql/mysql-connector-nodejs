/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('selecting rows from a table using CRUD with prepared statements', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session, table;

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

    beforeEach('create table', () => {
        return session.sql('CREATE TABLE test (_id VARBINARY(32), name VARCHAR(4))')
            .execute();
    });

    beforeEach('get table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return table.insert('_id', 'name')
            .values('1', 'foo')
            .values('2', 'bar')
            .values('3', 'baz')
            .values('4', 'qux')
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not create a prepared statement when the operation is executed once', () => {
        const expected = [[Buffer.from('1'), 'foo']];
        const actual = [];

        return table.select()
            .where('name = :name')
            .bind('name', 'foo')
            .execute(row => actual.push(row))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [[Buffer.from('2'), 'bar']];
        const actual = [];

        const op = table.select().where('name = :name').bind('name', 'foo');
        const sql = `SELECT * FROM \`${schema.getName()}\`.\`test\` WHERE (\`name\` = ?)`;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute(row => actual.push(row)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [['baz']];
        const actual = [];

        const op = table.select('name').where('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.bind('name', 'baz').groupBy('name').execute(row => actual.push(row)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const op = table.select().where('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; })
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist);
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const expected = [[Buffer.from('4'), 'qux']];
        const actual = [];

        const op = table.select().where('name = :name').bind('name', 'foo');
        const sql = `SELECT * FROM \`${schema.getName()}\`.\`test\` WHERE (\`name\` = ?) ORDER BY \`name\``;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.orderBy('name').execute())
            .then(() => op.bind('name', 'baz').execute())
            // at this point the operation still orders the results by the `name` property
            .then(() => op.bind('name', 'qux').execute(row => actual.push(row)))
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => fixtures.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-reprepares a statement using an implicit offset placeholder if a limit is introduced', () => {
        const expected = [[Buffer.from('1'), 'foo']];
        const actual = [];

        const op = table.select().orderBy('_id');
        const sql = `SELECT * FROM \`${schema.getName()}\`.\`test\` ORDER BY \`_id\` LIMIT ?, ?`;

        return op.execute()
            .then(() => op.execute())
            .then(() => op.limit(1).execute(row => actual.push(row)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            // statement id in the server should be incremented since the previous statement was deallocated
            // sql statement should include placeholders for both LIMIT and OFFSET
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not deallocate a statement when the offset is introduced later', () => {
        const expected = [[Buffer.from('1'), 'foo'], [Buffer.from('2'), 'bar']];
        const actual = [];

        const op = table.select().orderBy('_id');
        const sql = `SELECT * FROM \`${schema.getName()}\`.\`test\` ORDER BY \`_id\` LIMIT ?, ?`;

        return op.execute()
            .then(() => op.limit(1).execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.offset(1).execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            // statement id in the server should remain the same since the statement was not deallocated
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('when the total server statement count is exceeded', () => {
        beforeEach('prevent additional prepared statements', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=0')
                .execute();
        });

        afterEach('reset default prepared statement limit', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=16382')
                .execute();
        });

        it('neither fails nor prepares any statement', () => {
            const expected = [[Buffer.from('1'), 'foo'], [Buffer.from('2'), 'bar']];
            const actual = [];

            const op = table.select().where('_id = :id').bind('id', '1');

            return op.execute(row => actual.push(row))
                .then(() => op.bind('id', '2').execute(row => actual.push(row)))
                .then(() => fixtures.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
