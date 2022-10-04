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

describe('modifying documents in a collection using CRUD with prepared statements', () => {
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
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        return collection.modify('_id = :id')
            .bind('id', '1')
            .set('name', 'quux')
            .execute()
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');
        const sql = `UPDATE \`${schema.getName()}\`.\`test\` SET doc=JSON_SET(JSON_SET(doc,'$.name','quux'),'$._id',JSON_EXTRACT(\`doc\`,'$._id')) WHERE (JSON_UNQUOTE(JSON_EXTRACT(doc,'$._id')) = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.bind('id', '3').unset('name').execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; schema = s.getSchema(schema.getName()); collection = schema.getCollection('test'); })
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const expected = [{ _id: '1', name: 'quux' }, { _id: '2' }, { _id: '3' }, { _id: '4' }];
        const actual = [];

        const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');
        const sql = `UPDATE \`${schema.getName()}\`.\`test\` SET doc=JSON_SET(JSON_REMOVE(JSON_SET(doc,'$.name','quux'),'$.name'),'$._id',JSON_EXTRACT(\`doc\`,'$._id')) WHERE (JSON_UNQUOTE(JSON_EXTRACT(doc,'$._id')) = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.unset('name').execute())
            .then(() => op.bind('id', '3').execute())
            // at this point the operation still unsets the `name` property
            .then(() => op.bind('id', '4').execute())
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => fixtures.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
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
            const expected = [{ _id: '1', name: 'quux' }, { _id: '2', name: 'quux' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
            const actual = [];

            const op = collection.modify('_id = :id').bind('id', '1').set('name', 'quux');

            return op.execute()
                .then(() => op.bind('id', '2').execute())
                .then(() => fixtures.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
