/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');

describe('counting rows in tables using CRUD', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session;

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

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('when the table exists in the schema', () => {
        let table;

        beforeEach('create table', () => {
            return session.sql(`CREATE TABLE \`${schema.getName()}\`.test (name VARCHAR(3))`)
                .execute()
                .then(() => {
                    table = schema.getTable('test');
                });
        });

        it('returns 0 if the table does not contain any rows', () => {
            return table.count()
                .then(res => {
                    return expect(res).to.equal(0);
                });
        });

        context('when the table is not empty', () => {
            beforeEach('add fixtures', () => {
                return table.insert('name')
                    .values('foo')
                    .values('bar')
                    .execute();
            });

            it('returns the number of rows in the table', () => {
                return table.count()
                    .then(res => {
                        return expect(res).to.equal(2);
                    });
            });
        });
    });

    it('fails if the table does not exist in the schema', () => {
        const nonExistingTable = schema.getTable('test');
        const message = `Table '${schema.getName()}.${nonExistingTable.getName()}' doesn't exist`;

        return nonExistingTable.count()
            .then(() => {
                return expect.fail();
            })
            .catch(err => {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_NO_SUCH_TABLE);
                expect(err.info.msg).to.equal(message);
                expect(err.message).to.equal(message);
            });
    });
});
