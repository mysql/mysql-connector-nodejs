/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

describe('autonomous prepared statements for tables without server support', () => {
    let schema, session, table;

    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', socket: undefined, schema: config.schema || 'mysql-connector-nodejs_test' };

    beforeEach('create default schema', () => {
        const schemalessConfig = Object.assign({}, config, baseConfig, { schema: undefined });

        return fixtures.createSchema(baseConfig.schema, schemalessConfig);
    });

    beforeEach('create session using default schema', () => {
        const defaultSessionConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultSessionConfig)
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
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('select', () => {
        it('falls back to the regular execution mode', () => {
            // BUG#30162858 _id is a VARBINARY which should map to a Node.js Buffer.
            const expected = [[Buffer.from('1')], [Buffer.from('2')], [Buffer.from('3')]];
            const actual = [];

            const op = table.select('_id').where('name = :name');

            return op.bind('name', 'foo')
                .execute(row => actual.push(row))
                .then(() => {
                    return op.bind('name', 'bar')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return op.bind('name', 'baz')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return expect(actual).to.deep.equal(expected);
                });
        });
    });

    context('update', () => {
        it('falls back to the regular execution mode', () => {
            // BUG#30162858 _id is a VARBINARY which should map to a Node.js Buffer.
            const expected = [[Buffer.from('1'), 'qux'], [Buffer.from('2'), 'qux'], [Buffer.from('3'), 'qux']];
            const actual = [];

            const op = table.update().where('name = :name').set('name', 'qux');

            return op.bind('name', 'foo')
                .execute(row => actual.push(row))
                .then(() => {
                    return op.bind('name', 'bar')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return op.bind('name', 'baz')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return table.select().orderBy('_id')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return expect(actual).to.deep.equal(expected);
                });
        });
    });

    context('delete', () => {
        it('falls back to the regular execution mode', () => {
            const actual = [];

            const op = table.delete().where('name = :name');

            return op.bind('name', 'foo')
                .execute(row => actual.push(row))
                .then(() => {
                    return op.bind('name', 'bar')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return op.bind('name', 'baz')
                        .execute(row => actual.push(row));
                })
                .then(() => {
                    return table.select()
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    return expect(actual).to.be.empty;
                });
        });
    });
});
