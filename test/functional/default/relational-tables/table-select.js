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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('selecting rows from a table using CRUD', () => {
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
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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

    context('without criteria and projection', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        context('with a callback', () => {
            it('includes all the rows in the table (and all the columns for each row)', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];
                const actual = [];

                return table.select()
                    .execute(row => actual.push(row))
                    .then(() => expect(actual).to.deep.include.members(expected));
            });

            it('does not fail when trying to use a pull-based cursor', () => {
                const noop = () => {};

                return table.select()
                    .execute(noop)
                    .then(result => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });

            it('returns the column metadata once', () => {
                let rowCount = 0;

                return table.select()
                    .execute(() => {}, columns => {
                        rowCount += 1;

                        expect(columns).to.have.lengthOf(3);
                        expect(columns[0].getColumnName()).to.equal('id');
                        expect(columns[0].getType()).to.equal('BIGINT');
                        expect(columns[1].getColumnName()).to.equal('name');
                        expect(columns[1].getType()).to.equal('STRING');
                        expect(columns[2].getColumnName()).to.equal('age');
                        expect(columns[2].getType()).to.equal('INT');
                    })
                    .then(() => {
                        return expect(rowCount).to.equal(1);
                    });
            });
        });

        context('without a callback', () => {
            it('returns the first row in the resultset (and all its columns)', () => {
                const expected = [1, 'bar', 23];

                return table.select()
                    .orderBy('id')
                    .execute()
                    .then(result => {
                        let actual = result.fetchOne();
                        expect(actual).to.deep.equal(expected);

                        actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(1);
                    });
            });

            it('returns all the existing rows in the table (and all the columns for each row)', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];

                return table.select()
                    .execute()
                    .then(result => {
                        let actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.fetchAll();
                        return expect(actual).to.be.empty;
                    });
            });

            it('returns the resultset as an array', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];

                return table.select()
                    .execute()
                    .then(result => {
                        let actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.toArray();
                        return expect(actual).to.have.lengthOf(expected.length);
                    });
            });

            it('returns the column metadata for each row', () => {
                return table.select()
                    .execute()
                    .then(result => {
                        const columns = result.getColumns();

                        expect(columns).to.have.lengthOf(3);
                        expect(columns[0].getColumnName()).to.equal('id');
                        expect(columns[0].getType()).to.equal('BIGINT');
                        expect(columns[1].getColumnName()).to.equal('name');
                        expect(columns[1].getType()).to.equal('STRING');
                        expect(columns[2].getColumnName()).to.equal('age');
                        expect(columns[2].getType()).to.equal('INT');
                    });
            });
        });
    });

    context('with projection', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        it('includes only columns provided as an expression array', () => {
            const expected = [['bar', 23], ['foo', 42]];
            const actual = [];

            return table.select(['name', 'age'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });

        it('includes only columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });

        it('includes columns with a given alias', async () => {
            const expected = [['bar', 23], ['foo', 42]];

            const got = await table.select('name as theName', 'age as theAge')
                .orderBy('age')
                .execute();

            const columns = got.getColumns();

            expect(columns[0].getColumnLabel()).to.equal('theName');
            expect(columns[1].getColumnLabel()).to.equal('theAge');
            expect(got.fetchAll()).to.deep.equal(expected);
        });

        it('transforms the colum format with a computed projection', async () => {
            const expected = [[{ theName: 'bar', theAge: 23 }], [{ theName: 'foo', theAge: 42 }]];

            const got = await table.select(mysqlx.expr('{ "theName": name, "theAge": age }', { mode: mysqlx.Mode.TABLE }))
                .orderBy('age')
                .execute();

            expect(got.fetchAll()).to.deep.equal(expected);
        });
    });

    context('with order', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'foo', 23])
                .values([3, 'bar', 23])
                .execute();
        });

        it('sorts by columns provided as an expression array', () => {
            const expected = [['foo', 23], ['foo', 42], ['bar', 23]];
            const actual = [];

            return table.select('name', 'age')
                .orderBy(['name desc', 'age asc'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('sorts by columns provided as expression arguments', () => {
            const expected = [['foo', 42], ['foo', 23], ['bar', 23]];
            const actual = [];

            return table.select('name', 'age')
                .orderBy('age desc', 'name desc')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('groups columns provided as an expression array', () => {
            const expected = [['bar', 42], ['bar', 23], ['foo', 42], ['foo', 23]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy(['name', 'age'])
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('groups columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23], ['bar', 42], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy('age', 'name')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping criteria', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('groups columns provided as an expression array', () => {
            const expected = [['bar', 42], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy(['name', 'age'])
                .having('age > 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('groups columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy('age', 'name')
                .having('age = 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .values([4, 'qux', 23])
                .values([5, 'quux', 23])
                .execute();
        });

        it('returns a given number of row', () => {
            const expected = [[1, 'foo', 42], [2, 'bar', 23], [3, 'baz', 42]];
            const actual = [];

            return table.select()
                .limit(3)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the rows after a given offset', () => {
            const expected = [[3, 'baz', 42], [4, 'qux', 23]];
            const actual = [];

            return table.select()
                .limit(2)
                .offset(2)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .execute();
        });

        it('returns all documents that match a criteria specified by a grouped expression', () => {
            const expected = [[1, 'foo', 42], [3, 'baz', 42]];
            const actual = [];

            return table.select()
                .where("name in ('foo', 'baz')")
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [[2, 'bar', 23]];
            const actual = [];

            return table.select()
                .where('age not in (50, 42)')
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#32687374 rounding for DECIMAL fields', () => {
        beforeEach('add a DECIMAL column to the existing table', () => {
            return session.sql(`ALTER TABLE \`${schema.getName()}\`.\`${table.getName()}\` ADD COLUMN fpn DECIMAL (16,2)`)
                .execute();
        });

        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'fpn'])
                .values([1, 'foo', -56565656.56])
                .execute();
        });

        it('applies a filter using a floating point number expression literal without losing precision', () => {
            return table.select('name')
                .where('fpn = -56565656.56')
                .execute()
                .then(res => {
                    return expect(res.fetchOne()).to.deep.equal(['foo']);
                });
        });

        it('applies a filter using a floating point number placeholder argument without losing precision', () => {
            return table.select('name')
                .where('fpn = :float')
                .bind('float', -56565656.56)
                .execute()
                .then(res => {
                    return expect(res.fetchOne()).to.deep.equal(['foo']);
                });
        });
    });

    context('integer values in a result set', () => {
        const safeNegative = Number.MIN_SAFE_INTEGER + 1;
        const safePositive = Number.MAX_SAFE_INTEGER - 1;
        const unsafeNegative = '-9223372036854775808';
        const unsafePositive = '18446744073709551615';

        beforeEach('add relevant columns to the existing table', () => {
            return session.sql(`ALTER TABLE \`${schema.getName()}\`.\`${table.getName()}\`
                ADD COLUMN safeNegative BIGINT,
                ADD COLUMN safePositive BIGINT UNSIGNED,
                ADD COLUMN unsafeNegative BIGINT,
                ADD COLUMN unsafePositive BIGINT UNSIGNED`)
                .execute();
        });

        beforeEach('populate the table', async () => {
            return table.insert('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                .values(safeNegative, safePositive, BigInt(unsafeNegative), BigInt(unsafePositive))
                .execute();
        });

        context('consumed using a pull-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [`${safeNegative}`, `${safePositive}`, unsafeNegative, unsafePositive];

                const res = await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [BigInt(safeNegative), BigInt(safePositive), BigInt(unsafeNegative), BigInt(unsafePositive)];

                const res = await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [safeNegative, safePositive, unsafeNegative, unsafePositive];

                const res = await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [safeNegative, safePositive, BigInt(unsafeNegative), BigInt(unsafePositive)];

                const res = await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [safeNegative, safePositive, unsafeNegative, unsafePositive];

                const res = await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });

        context('consumed with a push-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[`${safeNegative}`, `${safePositive}`, unsafeNegative, unsafePositive]];
                const got = [];

                await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[BigInt(safeNegative), BigInt(safePositive), BigInt(unsafeNegative), BigInt(unsafePositive)]];
                const got = [];

                await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, unsafeNegative, unsafePositive]];
                const got = [];

                await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, BigInt(unsafeNegative), BigInt(unsafePositive)]];
                const got = [];

                await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, unsafeNegative, unsafePositive]];
                const got = [];

                await session.getDefaultSchema().getTable(table.getName())
                    .select('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });
    });

    context('unsafe number of affected items', () => {
        it('returns the number of records as a JavaScript string', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
            const rows = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
            const want = rows.length.toString();

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getTable(table.getName()).insert('name', 'age')
                .values(rows[0].name, rows[0].age)
                .values(rows[1].name, rows[1].age)
                .execute();

            const got = res.getAffectedItemsCount();

            await session.close();

            expect(got).to.equal(want);
        });

        it('returns the number of records as a JavaScript BigInt', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
            const rows = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
            const want = BigInt(rows.length);

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getTable(table.getName()).insert('name', 'age')
                .values(rows[0].name, rows[0].age)
                .values(rows[1].name, rows[1].age)
                .execute();

            const got = res.getAffectedItemsCount();

            await session.close();

            expect(got).to.equal(want);
        });
    });

    context('BUG#35707417', () => {
        beforeEach('add relevant columns to the existing table', () => {
            return session.sql(`ALTER TABLE \`${schema.getName()}\`.\`${table.getName()}\`
                ADD COLUMN de1 DECIMAL(18, 17),
                ADD COLUMN de2 DECIMAL(18, 13)`)
                .execute();
        });

        beforeEach('populate the table', async () => {
            return table.insert('de1', 'de2')
                .values('1.23456789012345678', '12345.6789012345678')
                .execute();
        });

        it('does not loose precision when retrieving values from fixed-point decimal columns', async () => {
            const want = ['1.23456789012345678', '12345.6789012345678'];
            const res = await table.select('de1', 'de2')
                .execute();

            const got = res.fetchOne();
            expect(got).to.deep.equal(want);
        });
    });

    context('when debug mode is enabled', () => {
        beforeEach('populate table', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 50])
                .execute();
        });

        it('logs the basic operation parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('collection', 'data_model');
                    expect(crudFind.collection).to.contain.keys('name', 'schema');
                    expect(crudFind.collection.name).to.equal(table.getName());
                    expect(crudFind.collection.schema).to.equal(schema.getName());
                    expect(crudFind.data_model).to.equal('TABLE');
                });
        });

        it('logs the criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name = :v', 'v', 'foo'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('criteria', 'args');
                    expect(crudFind.criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.criteria.type).to.equal('OPERATOR');
                    expect(crudFind.criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.criteria.operator.name).to.equal('==');
                    expect(crudFind.criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.criteria.operator.param[0].type).to.equal('IDENT');
                    expect(crudFind.criteria.operator.param[0].identifier).contain.keys('name');
                    expect(crudFind.criteria.operator.param[0].identifier.name).to.equal('name');
                    expect(crudFind.criteria.operator.param[1]).to.contain.keys('type', 'position');
                    expect(crudFind.criteria.operator.param[1].type).to.equal('PLACEHOLDER');
                    expect(crudFind.criteria.operator.param[1].position).to.equal(0);
                    expect(crudFind.args).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.args[0]).to.contain.keys('type', 'v_string');
                    expect(crudFind.args[0].type).to.equal('V_STRING');
                    expect(crudFind.args[0].v_string).to.contain.keys('value');
                    expect(crudFind.args[0].v_string.value).to.equal('foo');
                });
        });

        it('logs the projection statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-projection.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name AS col'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('projection');
                    expect(crudFind.projection).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.projection[0]).contain.keys('source', 'alias');
                    expect(crudFind.projection[0].source).to.contain.keys('type', 'identifier');
                    expect(crudFind.projection[0].source.type).to.equal('IDENT');
                    expect(crudFind.projection[0].source.identifier).to.contain.keys('name');
                    expect(crudFind.projection[0].source.identifier.name).to.equal('name');
                    expect(crudFind.projection[0].alias).to.equal('col');
                });
        });

        it('logs the order statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-order.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'age DESC'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('order');
                    expect(crudFind.order).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.order[0]).to.contain.keys('expr', 'direction');
                    expect(crudFind.order[0].expr).to.contain.keys('type', 'identifier');
                    expect(crudFind.order[0].expr.type).to.equal('IDENT');
                    expect(crudFind.order[0].expr.identifier).to.contain.keys('name');
                    expect(crudFind.order[0].expr.identifier.name).to.equal('age');
                    expect(crudFind.order[0].direction).to.equal('DESC');
                });
        });

        it('logs the grouping statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-grouping.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name, AVG(age)', 'name'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping');
                    expect(crudFind.grouping).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.grouping[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping[0].type).equal('IDENT');
                    expect(crudFind.grouping[0].identifier).to.contain.keys('name');
                    expect(crudFind.grouping[0].identifier.name).to.equal('name');
                });
        });

        it('logs the grouping criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-grouping-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name, AVG(age) as age', 'name', 'age > 22'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping_criteria');
                    expect(crudFind.grouping_criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.grouping_criteria.type).equal('OPERATOR');
                    expect(crudFind.grouping_criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.grouping_criteria.operator.name).to.equal('>');
                    expect(crudFind.grouping_criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.grouping_criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping_criteria.operator.param[0].identifier).to.contain.keys('name');
                    expect(crudFind.grouping_criteria.operator.param[0].identifier.name).to.equal('age');
                    expect(crudFind.grouping_criteria.operator.param[1]).to.contain.keys('type', 'literal');
                    expect(crudFind.grouping_criteria.operator.param[1].type).to.equal('LITERAL');
                    expect(crudFind.grouping_criteria.operator.param[1].literal).to.contain.keys('type', 'v_unsigned_int');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.type).to.equal('V_UINT');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.v_unsigned_int).to.equal(22);
                });
        });

        it('logs the correct locking parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-locking.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), mysqlx.LockContention.SKIP_LOCKED])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('locking', 'locking_options');
                    expect(crudFind.locking).to.equal('SHARED_LOCK');
                    expect(crudFind.locking_options).to.equal('SKIP_LOCKED');
                });
        });

        it('logs the result set column metadata sent by the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-projection.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.ColumnMetaData', script, [schema.getName(), table.getName(), 'age as col'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const columnMetadata = proc.logs[0];
                    expect(columnMetadata).to.contain.keys('type', 'name', 'original_name', 'table', 'original_table', 'schema', 'catalog', 'collation', 'fractional_digits', 'length', 'flags');
                    expect(columnMetadata.type).to.equal('SINT'); // INT is SIGNED by default
                    expect(columnMetadata.name).to.equal('col');
                    expect(columnMetadata.original_name).to.equal('age');
                    expect(columnMetadata.table).to.equal(table.getName());
                    expect(columnMetadata.original_table).to.equal(table.getName());
                    expect(columnMetadata.schema).to.equal(schema.getName());
                    expect(columnMetadata.catalog).to.equal('def'); // always "def"
                    expect(columnMetadata.collation).to.equal(0); // no collation for INT
                    expect(columnMetadata.fractional_digits).to.equal(0);
                    expect(columnMetadata.length).to.equal(11); // sizeof INT
                    expect(columnMetadata.flags).to.equal(0);
                });
        });

        it('logs the result set row data sent by the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.Row', script, [schema.getName(), table.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(3); // number of rows

                    const rows = proc.logs;
                    rows.forEach(row => expect(row).to.contain.keys('fields'));
                    expect(rows[0].fields).to.deep.equal([1, 'foo', 42]);
                    expect(rows[1].fields).to.deep.equal([2, 'bar', 23]);
                    expect(rows[2].fields).to.deep.equal([3, 'foo', 50]);
                });
        });
    });
});
