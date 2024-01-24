/*
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
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

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');

describe('regressions introduced by server patches related to prepared statements', () => {
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

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('BUG#33331322', () => {
        let autoGeneratedIds;

        beforeEach('add fixtures', () => {
            return collection
                .add({ name: 'foo' })
                .add({ name: 'bar' })
                .execute()
                .then(res => {
                    autoGeneratedIds = res.getGeneratedIds();
                });
        });

        it('hits a match when performing the index lookup for auto generated ids', async () => {
            const docs = [{ _id: autoGeneratedIds[0], name: 'foo' }, { _id: autoGeneratedIds[1], name: 'bar' }];
            const stmt = collection.find('_id = :id');

            let res = await stmt.bind('id', autoGeneratedIds[0])
                .execute();
            expect(res.fetchOne()).to.deep.equal(docs[0]);

            res = await stmt.bind('id', autoGeneratedIds[1])
                .execute();
            expect(res.fetchOne()).to.deep.equal(docs[1]);

            // Checking if the index was used for a given event can be done via
            // the performance_schema.events_statements_history table using the
            // corresponding thread id.
            // Obtaining the the performance_schema thread id can be done using
            // the ps_thread_id() function.
            // https://dev.mysql.com/doc/refman/8.0/en/sys-ps-thread-id.html
            res = await session.sql('SELECT sys.ps_thread_id(NULL)')
                .execute();

            const threadId = res.fetchOne()[0];
            // We are insterested in the event that represents the statement
            // execution 'statement/com/Execute'.
            res = await session.sql('SELECT NO_INDEX_USED, NO_GOOD_INDEX_USED FROM performance_schema.events_statements_history WHERE EVENT_NAME = ? AND THREAD_ID = ? ORDER BY EVENT_ID DESC')
                .bind('statement/com/Execute', threadId)
                .execute();
            // If an index was used, the last executed statement should have
            // both NO_INDEX_USED and NO_GOOD_INDEX_USED set to 0.
            // https://dev.mysql.com/doc/refman/5.6/en/performance-schema-events-statements-current-table.html
            expect(res.fetchOne()).to.deep.equal([0, 0]);
        });
    });
});
