/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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
const mysqlx = require('../../../../');
const path = require('path');

describe('inserting data into a table using CRUD', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let session, schema, table;

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
        return session.sql(`CREATE TABLE test (
            name VARCHAR(255),
            age INT)`).execute();
    });

    beforeEach('load table', () => {
        table = schema.getTable('test');
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('with an array of columns', () => {
        it('inserts values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert(['name', 'age'])
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert(['name', 'age'])
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with multiple column arguments', () => {
        it('inserts values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert('name', 'age')
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            const actual = [];

            return table.insert('name', 'age')
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => table.select().orderBy('age').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    // TODO(Rui): remove support for this functionality since its not described by the EBNF.
    it('inserts values provided as a mapping object to each column', () => {
        const expected = [['foo', 23]];
        const actual = [];

        return table.insert({ name: 'foo', age: 23 })
            .execute()
            .then(() => table.select().execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('falsy values', () => {
        it('inserts `0` values', () => {
            const expected = [['foo', 0]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', 0)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts `false` values', () => {
            const expected = [['foo', 0]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', false)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('inserts `null` values', () => {
            const expected = [['foo', null]];
            const actual = [];

            return table.insert('name', 'age')
                .values('foo', null)
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('BUG#31709879 fails to insert `undefined` values', () => {
            return table.insert('name', 'age')
                .values('foo', undefined)
                .execute()
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(errors.ER_X_BAD_INSERT_DATA);
                });
        });
    });

    // JavaScript can happily store Number.MAX_SAFE_INTEGER + 1 and Number.MAX_SAFE_INTEGER - 1.
    context('unsafe numeric values for BIGINT columns', () => {
        beforeEach('add BIGINT columns to the existing table', async () => {
            await session.sql('ALTER TABLE test ADD COLUMN (unsafePositive BIGINT UNSIGNED, unsafeNegative BIGINT SIGNED)')
                .execute();
        });

        it('saves values specified with a JavaScript string', async () => {
            const unsafePositive = Number.MAX_SAFE_INTEGER + 1;
            const unsafeNegative = Number.MIN_SAFE_INTEGER - 1;
            const want = [`${unsafePositive}`, `${unsafeNegative}`];

            await table.insert('unsafePositive', 'unsafeNegative')
                .values(unsafePositive, unsafeNegative)
                .execute();

            const res = await table.select('unsafePositive', 'unsafeNegative')
                .execute();

            const got = res.fetchOne();

            expect(got).to.deep.equal(want);
        });

        it('saves values specified with a JavaScript BigInt', async () => {
            const unsafePositive = '18446744073709551615';
            const unsafeNegative = '-9223372036854775808';
            const want = [`${unsafePositive}`, `${unsafeNegative}`];

            await table.insert('unsafePositive', 'unsafeNegative')
                .values(BigInt(unsafePositive), BigInt(unsafeNegative))
                .execute();

            const res = await table.select('unsafePositive', 'unsafeNegative')
                .execute();

            const got = res.fetchOne();

            expect(got).to.deep.equal(want);
        });
    });

    context('BUG#30158425', () => {
        beforeEach('add BLOB column', () => {
            return session.sql('ALTER TABLE test ADD COLUMN (bin BLOB)')
                .execute();
        });

        it('saves a Node.js Buffer as a MySQL BLOB', () => {
            const data = Buffer.from('foo');
            const expected = [[data]];
            const actual = [];

            return table.insert('bin')
                .values(data)
                .execute()
                .then(() => {
                    return table.select('bin').execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30401962 affected items', () => {
        it('returns the number of rows that have been inserted into the table', () => {
            return table.insert('name', 'age')
                .values('foo', 23)
                .values('bar', 42)
                .values('baz', 50)
                .execute()
                .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
        });
    });

    context('BUG#34896695 unsafe integer value of AUTO_INCREMENT', () => {
        beforeEach('add AUTO_INCREMENT column to the table', async () => {
            await session.sql('ALTER TABLE test ADD COLUMN (id BIGINT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY)')
                .execute();
        });

        it('returns the number of records as a JavaScript string', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
            const want = '18446744073709551615';

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getTable(table.getName()).insert('id', 'name', 'age')
                .values(BigInt(want), 'foo', 42)
                .execute();

            const got = res.getAutoIncrementValue();

            await session.close();

            expect(got).to.equal(want);
        });

        it('returns the number of records as a JavaScript string', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
            const want = BigInt('18446744073709551615');

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getTable(table.getName()).insert('id', 'name', 'age')
                .values(want, 'foo', 42)
                .execute();

            const got = res.getAutoIncrementValue();

            await session.close();

            expect(got).to.equal(want);
        });
    });

    context('BUG#31734504 rounding for DOUBLE fields', () => {
        beforeEach('create table', () => {
            return session.sql('CREATE TABLE double_precision (v_double DOUBLE)')
                .execute();
        });

        beforeEach('load table', () => {
            table = schema.getTable('double_precision');
        });

        it('correctly stores values as DOUBLE to not lose precision', () => {
            return table.insert('v_double')
                .values(1.000001)
                .execute()
                .then(() => {
                    return table.select()
                        .execute();
                })
                .then(res => {
                    expect(res.getColumns()[0].getType()).to.equal('DOUBLE');
                    expect(res.fetchOne()).to.deep.equal([1.000001]);
                });
        });
    });

    context('BUG#32687374 rounding for DECIMAL fields', () => {
        beforeEach('create table', () => {
            return session.sql('CREATE TABLE decimal_precision (v_decimal DECIMAL(16, 2))')
                .execute();
        });

        beforeEach('load table', () => {
            table = schema.getTable('decimal_precision');
        });

        it('inserts floating point numbers without losing precision', () => {
            return table.insert('v_decimal')
                .values(-56565656.56)
                .execute()
                .then(() => {
                    return table.select()
                        .execute();
                })
                .then(res => {
                    expect(res.getColumns()[0].getType()).to.equal('DECIMAL');
                    expect(res.fetchOne()).to.deep.equal([-56565656.56]);
                });
        });
    });

    // https://dev.mysql.com/doc/x-devapi-userguide/en/working-with-auto-increment-values.html
    context('AUTO INCREMENT columns', () => {
        beforeEach('create table', () => {
            return session.sql('CREATE TABLE auto (id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, name VARCHAR(3))')
                .execute();
        });

        beforeEach('load table', () => {
            table = schema.getTable('auto');
        });

        it('returns the first automatically generated value for a column', () => {
            return table.insert('name')
                .values('foo')
                .values('bar')
                .execute()
                .then(res => {
                    expect(res.getAutoIncrementValue()).to.equal(1);
                })
                .then(() => {
                    return table.insert('name')
                        .values('baz')
                        .execute();
                })
                .then(res => {
                    expect(res.getAutoIncrementValue()).to.equal(3);
                });
        });

        it('returns the last manually provided value for a column', () => {
            return table.insert('id', 'name')
                .values(5, 'foo')
                .values(6, 'bar')
                .execute()
                .then(res => {
                    expect(res.getAutoIncrementValue()).to.equal(6);
                });
        });
    });

    context('BUG#35666605', () => {
        beforeEach('create table', async () => {
            await session.sql('CREATE TABLE geo_t (id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, geo GEOMETRY)')
                .execute();
        });

        beforeEach('load table', () => {
            table = schema.getTable('geo_t');
        });

        it('allows to insert values encoded as X DevAPI expressions', async () => {
            const want = { type: 'Point', coordinates: [102, 0] };

            await table.insert('geo')
                .values(mysqlx.expr(`ST_GeomFromGeoJSON('${JSON.stringify(want)}')`))
                .execute();

            const res = await table.select('ST_AsGeoJSON(geo)')
                .execute();

            const got = res.fetchOne()[0];

            expect(got).to.deep.equal(want);
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'insert.js');
        const columns = ['name', 'age'];
        const values = ['foo', 23];

        it('logs the basic operation parameters', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), table.getName(), JSON.stringify(columns), JSON.stringify(values)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd).to.contain.keys('collection', 'data_model');
                    expect(crudAdd.collection).to.contain.keys('name', 'schema');
                    expect(crudAdd.collection.name).to.equal(table.getName());
                    expect(crudAdd.collection.schema).to.equal(schema.getName());
                    expect(crudAdd.data_model).to.equal('TABLE');
                });
        });

        it('logs the column names', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), table.getName(), JSON.stringify(columns), JSON.stringify(values)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd).to.contain.keys('row');

                    const projection = crudAdd.projection;
                    expect(projection).to.be.an('array').and.have.lengthOf(columns.length);
                    projection.forEach((column, index) => {
                        expect(column).to.have.keys('name');
                        expect(column.name).to.equal(columns[index]);
                    });
                });
        });

        it('logs the column values', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), table.getName(), JSON.stringify(columns), JSON.stringify(values)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd).to.contain.keys('row');

                    const rows = crudAdd.row;
                    expect(rows).to.be.an('array').and.have.lengthOf(1);

                    rows.forEach(row => {
                        expect(row).to.have.keys('field');
                        expect(row.field).to.be.an('array').and.have.lengthOf(values.length);
                        expect(row.field[0]).to.have.keys('type', 'literal');
                        expect(row.field[0].type).to.equal('LITERAL');
                    });

                    expect(rows[0].field[0].literal).to.have.keys('type', 'v_string');
                    expect(rows[0].field[0].literal.type).to.equal('V_STRING');
                    expect(rows[0].field[0].literal.v_string).to.have.keys('value');
                    expect(rows[0].field[0].literal.v_string.value).to.equal(values[0]);

                    expect(rows[0].field[1].literal).to.have.keys('type', 'v_unsigned_int');
                    expect(rows[0].field[1].literal.type).to.equal('V_UINT');
                    expect(rows[0].field[1].literal.v_unsigned_int).to.equal(values[1]);
                });
        });

        it('logs the table changes metadata', () => {
            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [schema.getName(), table.getName(), JSON.stringify(columns), JSON.stringify(values)])
                .then(proc => {
                    // LOCAL notices are decoded twice (needs to be improved)
                    // so there are no assurances about the correct length
                    expect(proc.logs).to.have.length.above(0);

                    const rowsAffectedNotice = proc.logs[proc.logs.length - 1];
                    expect(rowsAffectedNotice).to.have.keys('type', 'scope', 'payload');
                    expect(rowsAffectedNotice.type).to.equal('SESSION_STATE_CHANGED');
                    expect(rowsAffectedNotice.scope).to.equal('LOCAL');
                    expect(rowsAffectedNotice.payload).to.have.keys('param', 'value');
                    expect(rowsAffectedNotice.payload.param).to.equal('ROWS_AFFECTED');
                    expect(rowsAffectedNotice.payload.value).to.be.an('array').and.have.lengthOf(1);
                    expect(rowsAffectedNotice.payload.value[0]).to.have.keys('type', 'v_unsigned_int');
                    expect(rowsAffectedNotice.payload.value[0].type).to.equal('V_UINT');
                    expect(rowsAffectedNotice.payload.value[0].v_unsigned_int).to.equal(1);
                });
        });
    });
});
