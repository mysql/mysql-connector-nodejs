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
const mysqlx = require('../../../..');
const path = require('path');

describe('finding documents in collections using CRUD with prepared statements', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let collection, schema, session;

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

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .add({ _id: '3', name: 'baz' })
            .add({ _id: '4', name: 'qux' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not create a prepared statement when the operation is executed once', () => {
        const expected = [{ _id: '1', name: 'foo' }];
        const actual = [];

        return collection.find('name = :name')
            .bind('name', 'foo')
            .execute(doc => actual.push(doc))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not create a prepared statement when the operation is re-created after the first execution', () => {
        const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '1', name: 'foo' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.find();

        return op.execute()
            .then(() => op.sort('name').execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => op.sort('name').execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '2', name: 'bar' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');
        const sql = `SELECT doc FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$.name') = ?)`;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '3' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.bind('name', 'baz').fields('_id').execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const op = collection.find('name = :name').bind('name', 'foo');

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; })
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist);
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const expected = [{ _id: '4' }];
        const actual = [];

        const op = collection.find('name = :name').bind('name', 'foo');
        const sql = `SELECT JSON_OBJECT('_id', JSON_EXTRACT(doc,'$._id')) AS doc FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$.name') = ?)`;

        return op.execute()
            .then(() => op.bind('name', 'bar').execute())
            .then(() => op.fields('_id').execute())
            .then(() => op.bind('name', 'baz').execute())
            // at this point the operation still projects the `_id` property only
            .then(() => op.bind('name', 'qux').execute(doc => actual.push(doc)))
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => fixtures.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-reprepares a statement using an implicit offset placeholder if a limit is introduced', () => {
        const expected = [{ _id: '1', name: 'foo' }];
        const actual = [];

        const op = collection.find();
        const sql = `SELECT doc FROM \`${schema.getName()}\`.\`test\` LIMIT ?, ?`;

        return op.execute()
            .then(() => op.execute())
            .then(() => op.limit(1).execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            // statement id in the server should be incremented since the previous statement was deallocated
            // sql statement should include placeholders for both LIMIT and OFFSET
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not deallocate a statement when the offset is introduced later', () => {
        const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
        const actual = [];

        const op = collection.find();
        const sql = `SELECT doc FROM \`${schema.getName()}\`.\`test\` LIMIT ?, ?`;

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

    it('does not deallocate a statement when the limit and offset are changed', () => {
        const expected = [{ _id: '2', name: 'bar' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.find();
        const sql = `SELECT doc FROM \`${schema.getName()}\`.\`test\` LIMIT ?, ?`;

        return op.execute()
            .then(() => op.limit(1).offset(1).execute(doc => actual.push(doc)))
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.limit(2).offset(3).execute(doc => actual.push(doc)))
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
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            const actual = [];

            const op = collection.find('name = :name').bind('name', 'foo');

            return op.execute(doc => actual.push(doc))
                .then(() => op.bind('name', 'bar').execute(doc => actual.push(doc)))
                .then(() => fixtures.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'prepared-find.js');
        const fstRunBindings = { limit: 2, offset: 2 };
        const sndRunBindings = { limit: 3, offset: 1 };

        it('logs the message to create a prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Prepare', script, [schema.getName(), collection.getName(), JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    expect(proc.logs[0]).to.contain.keys('stmt_id', 'stmt');
                    expect(proc.logs[0].stmt_id).to.equal(1);
                    expect(proc.logs[0].stmt).to.have.keys('type', 'find');
                    expect(proc.logs[0].stmt.type).to.equal('FIND');
                    expect(proc.logs[0].stmt.find).to.have.keys('collection', 'data_model', 'limit_expr');
                    expect(proc.logs[0].stmt.find.limit_expr).to.have.keys('row_count', 'offset');
                    expect(proc.logs[0].stmt.find.limit_expr.row_count).to.have.keys('type', 'position');
                    expect(proc.logs[0].stmt.find.limit_expr.row_count.type).to.equal('PLACEHOLDER');
                    expect(proc.logs[0].stmt.find.limit_expr.row_count.position).to.equal(0);
                    expect(proc.logs[0].stmt.find.limit_expr.offset).to.have.keys('type', 'position');
                    expect(proc.logs[0].stmt.find.limit_expr.offset.type).to.equal('PLACEHOLDER');
                    expect(proc.logs[0].stmt.find.limit_expr.offset.position).to.equal(1);
                });
        });

        it('logs the message to execute a prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Execute', script, [schema.getName(), collection.getName(), JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    expect(proc.logs[0]).to.contain.keys('stmt_id', 'args');
                    expect(proc.logs[0].stmt_id).to.equal(1);
                    expect(proc.logs[0].args).to.be.an('array').and.have.lengthOf(2);

                    const args = proc.logs[0].args;
                    args.forEach(arg => {
                        expect(arg).to.have.keys('type', 'scalar');
                        expect(arg.type).to.equal('SCALAR');
                        expect(arg.scalar).to.have.keys('type', 'v_unsigned_int');
                        expect(arg.scalar.type).to.equal('V_UINT');
                    });

                    // should contain the values of the second run
                    expect(args[0].scalar.v_unsigned_int).to.equal(3);
                    expect(args[1].scalar.v_unsigned_int).to.equal(1);
                });
        });

        it('does not log a message to deallocate a prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Deallocate', script, [schema.getName(), collection.getName(), JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    return expect(proc.logs).to.be.an('array').and.be.empty;
                });
        });
    });
});
