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

// TODO(Rui): extract tests into proper self-contained suites.
describe('relational miscellaneous tests', () => {
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

    context('raw SQL query', () => {
        it('handles the results with a callback provided as an argument', () => {
            const expected = [1];
            let actual;

            return session.sql('SELECT 1')
                .execute(row => { actual = row; })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('handles the column metadata with a callback provided as an argument', () => {
            const actual = {};

            return session.sql('SELECT 1')
                .execute(row => { actual.row = row; }, meta => { actual.meta = meta; })
                .then(() => {
                    expect(actual).to.have.all.keys('meta', 'row');
                    expect(actual.meta).to.have.lengthOf(1);
                    expect(actual.meta[0]).to.contain.keys('getType', 'getColumnLabel', 'getColumnName', 'getTableLabel', 'getTableName', 'getSchemaName', 'getLength');
                    expect(actual.meta[0].getType()).to.equal('TINYINT');
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.be.a('number');
                });
        });

        it('handles the results using both callbacks provided in an object', () => {
            const actual = {};

            return session.sql('SELECT 1')
                .execute({
                    row (row) {
                        actual.row = row;
                    },
                    meta (meta) {
                        actual.meta = meta;
                    }
                })
                .then(() => {
                    expect(actual).to.have.all.keys('meta', 'row');
                    expect(actual.meta).to.have.lengthOf(1);
                    expect(actual.meta[0]).to.contain.keys('getType', 'getColumnLabel', 'getColumnName', 'getTableLabel', 'getTableName', 'getSchemaName', 'getLength');
                    expect(actual.meta[0].getType()).to.equal('TINYINT');
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.be.a('number');
                });
        });

        context('placeholder binding', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        name VARCHAR(5),
                        age TINYINT)`)
                    .execute();
            });

            it('binds values to query placeholders', () => {
                const rows = [];
                const expected = [['foo'], ['baz']];

                return session.sql('INSERT INTO test VALUES (?, ?), (?, ?), (?, ?)')
                    .bind('foo', 23, 'bar')
                    .bind([42, 'baz', 23])
                    .execute()
                    .then(() => {
                        return session
                            .sql('SELECT name FROM test WHERE age < ?')
                            .bind(40)
                            .execute(row => rows.push(row))
                            .then(() => expect(rows).to.deep.equal(expected));
                    });
            });
        });
    });

    context('column type decoding', () => {
        context('values encoded as SINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        tiny_signed_int_1 TINYINT,
                        tiny_signed_int_2 TINYINT,
                        small_signed_int_1 SMALLINT,
                        small_signed_int_2 SMALLINT,
                        medium_signed_int_1 MEDIUMINT,
                        medium_signed_int_2 MEDIUMINT,
                        signed_int_1 INT,
                        signed_int_2 INT,
                        big_signed_int_1 BIGINT,
                        big_signed_int_2 BIGINT)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (
                        -128, 127, -32768, 32767, -8388608, 8388607, -2147483648, 2147483647, -9223372036854775808, 9223372036854775807)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[-128, 127, -32768, 32767, -8388608, 8388607, -2147483648, 2147483647, '-9223372036854775808', '9223372036854775807']];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('BUG# non BIGINT values store in BIGINT columns', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (not_big_int BIGINT)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (4294967295)')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [4294967295];

                return schema.getTable('test').select()
                    .execute()
                    .then(res => expect(res.fetchOne()).to.deep.equal(expected));
            });
        });

        context('values encoded as UINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        tiny_unsigned_int_1 TINYINT UNSIGNED,
                        tiny_unsigned_int_2 TINYINT UNSIGNED,
                        small_unsigned_int_1 SMALLINT UNSIGNED,
                        small_unsigned_int_2 SMALLINT UNSIGNED,
                        medium_unsigned_int_1 MEDIUMINT UNSIGNED,
                        medium_unsigned_int_2 MEDIUMINT UNSIGNED,
                        signed_int_1 INT UNSIGNED,
                        signed_int_2 INT UNSIGNED,
                        big_unsigned_int_1 BIGINT UNSIGNED,
                        big_unsigned_int_2 BIGINT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (
                        0, 255, 0, 65535, 0, 16777215, 0, 16777215, 0, 18446744073709551615)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[0, 255, 0, 65535, 0, 16777215, 0, 16777215, 0, '18446744073709551615']];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as BIT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (bit_1 BIT, bit_2 BIT(3))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (b\'1\', b\'111\')')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [['1', '7']];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as DOUBLE and FLOAT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        double_1 DOUBLE,
                        double_2 DOUBLE PRECISION (5, 4),
                        float_1 FLOAT(3, 2))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (
                        1.2345678910111213141516171819202, 1.23456789, 1.23456789)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                // eslint-disable-next-line no-loss-of-precision
                const expected = [[1.2345678910111213141516171819202, 1.2346, 1.23]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('decodes the column metadata correctly', () => {
                return schema.getTable('test').select()
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getFractionalDigits()).to.equal(31);
                        expect(columns[1].getFractionalDigits()).to.equal(4);
                        expect(columns[2].getFractionalDigits()).to.equal(2);
                    });
            });
        });

        context('values encoded as BYTES', () => {
            context('BLOB columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE test (
                            a_tiny_blob TINYBLOB,
                            a_blob BLOB(5),
                            a_medium_blob MEDIUMBLOB,
                            a_long_blob LONGBLOB)`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("foo", "bar", "baz", "qux")')
                        .execute();
                });

                it('decodes values correctly', () => {
                    const expected = [[Buffer.from('foo'), Buffer.from('bar'), Buffer.from('baz'), Buffer.from('qux')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('TEXT columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE test (
                            a_tiny_text TINYTEXT,
                            a_text TEXT(5),
                            a_medium_text MEDIUMTEXT,
                            a_long_text LONGTEXT)`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("foo", "bar", "baz", "qux")')
                        .execute();
                });

                it('decodes values correctly', () => {
                    const expected = [['foo', 'bar', 'baz', 'qux']];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('variable and fixed size BINARY columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE test (
                            a_varbinary VARBINARY(5),
                            a_binary BINARY(5))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("foo", "bar")')
                        .execute();
                });

                it('decodes values correctly', () => {
                    // BINARY length = byte size
                    const expected = [[Buffer.from('foo'), Buffer.from('bar\0\0')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('variable and fixed size CHAR columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE test (
                            a_varchar VARCHAR(5),
                            a_char CHAR(5))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("foo", "bar")')
                        .execute();
                });

                it('decodes values correctly', () => {
                    // CHAR length = byte size * 4 (to accommodate UTF8)
                    const expected = [['foo', 'bar                 ']];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('BUG#30030159', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE test (
                            a_char CHAR(4),
                            a_binary BINARY(4))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("0", "0")')
                        .execute();
                });

                it('decodes numeric values for columns of fixed-length datatypes that require padding', () => {
                    // BINARY length = byte size
                    // CHAR length = byte size * 4 (to accommodate UTF8)
                    const expected = [['0               ', Buffer.from('0\0\0\0')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('ENUM columns', () => {
                beforeEach('create table', () => {
                    return session.sql('CREATE TABLE test (a_enum ENUM(\'foo\', \'bar\', \'baz\'))')
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES ("foo")')
                        .execute();
                });

                it('decodes values correctly', () => {
                    const expected = [['foo']];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('GEOMETRY columns', () => {
                beforeEach('create table', () => {
                    return session.sql('CREATE TABLE test (a_geo GEOMETRY)')
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql('INSERT INTO test VALUES (ST_GeomFromText(\'POINT(1 1)\'))')
                        .execute();
                });

                it('decodes values correctly', () => {
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => actual.forEach(row => expect(row[0]).to.be.an.instanceof(Buffer)));
                });
            });
        });

        context('values encoded as TIME', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (a_time TIME(6))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('11 12:13:14'),  ('-12:13:14'), ('12:13:14.123456'),
                        ('21 22:03'), ('-22:03'), ('22:03'), ('1 02'), ('-02'), ('02'), ('101112'), ('-101112'), (101112), (-101112), (8), (-8)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [
                    ['+276:13:14.000000'],
                    ['-12:13:14.000000'],
                    ['+12:13:14.123456'],
                    ['+526:03:00.000000'],
                    ['-22:03:00.000000'],
                    ['+22:03:00.000000'],
                    ['+26:00:00.000000'],
                    ['-00:00:02.000000'],
                    ['+00:00:02.000000'],
                    ['+10:11:12.000000'],
                    ['-10:11:12.000000'],
                    ['+10:11:12.000000'],
                    ['-10:11:12.000000'],
                    ['+00:00:08.000000'],
                    ['-00:00:08.000000']
                ];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as DATE, DATETIME or TIMESTAMP', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        a_date DATE,
                        a_datetime DATETIME,
                        a_timestamp TIMESTAMP)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'2018-02-18\', \'2018-02-18 12:33:17\', \'2018-02-18 12:33:17.123456\')')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[new Date('2018-02-18Z'), new Date('2018-02-18T12:33:17Z'), 1518957197000]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        decimal_1 DECIMAL,
                        decimal_2 DECIMAL(3),
                        decimal_3 DECIMAL(3,2))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-999.99, 999, 9.99)')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[-1000, 999, 9.99]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('decodes the column metadata correctly', () => {
                return schema.getTable('test').select()
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getFractionalDigits()).to.equal(0);
                        expect(columns[1].getFractionalDigits()).to.equal(0);
                        expect(columns[2].getFractionalDigits()).to.equal(2);
                    });
            });
        });

        context('BUG#34016587 values encoded as DECIMAL with precision loss', () => {
            beforeEach('create table', () => {
                // A JavaScript number does not have enough precision to safely
                // represent a decimal value with more than 16 decimal scale
                // digits (sometimes even less depending on which digits).
                return session.sql(`CREATE TABLE test (
                        decimal_1 DECIMAL(17, 1),
                        decimal_2 DECIMAL(17, 16),
                        decimal_3 DECIMAL(17, 16),
                        decimal_4 DECIMAL(17, 1))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-9999999999999999.9, -9.9999999999999999, 9.9999999999999999, 9999999999999999.9)')
                    .execute();
            });

            it('decodes values using a string to avoid precision loss', () => {
                const expected = [['-9999999999999999.9', '-9.9999999999999999', '9.9999999999999999', '9999999999999999.9']];

                return schema.getTable('test').select()
                    .execute()
                    .then(res => {
                        return expect(res.fetchAll()).to.deep.equal(expected);
                    });
            });
        });

        context('values encoded as SET', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (a_set SET(\'foo\', \'bar\'))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo,bar\'), (\'foo\'), (\'\'), (NULL)')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[['foo', 'bar']], [['foo']], [[]], [null]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('BUG#31654667 single-character SET values', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (a_set SET(\'S\', \'M\', \'L\'))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'S,M,L\'), (\'S,L\'), (\'L\')')
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[['S', 'M', 'L']], [['S', 'L']], [['L']]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('NULL values', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (
                        null_01 TINYINT,
                        null_02 TINYINT UNSIGNED,
                        null_03 SMALLINT,
                        null_04 SMALLINT UNSIGNED,
                        null_05 MEDIUMINT,
                        null_06 MEDIUMINT UNSIGNED,
                        null_07 INT,
                        null_08 INT UNSIGNED,
                        null_09 BIGINT,
                        null_10 BIGINT UNSIGNED,
                        null_11 DOUBLE,
                        null_12 FLOAT,
                        null_13 DECIMAL,
                        null_14 VARCHAR(5),
                        null_15 CHAR(5),
                        null_16 VARBINARY(5),
                        null_17 BINARY(5),
                        null_18 ENUM('foo', 'bar'),
                        null_19 TIME,
                        null_20 DATE,
                        null_21 DATETIME,
                        null_22 TIMESTAMP,
                        null_23 SET('foo', 'bar'),
                        null_24 BIT
                    )`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[]];
                const actual = [];

                for (let i = 0; i < 24; ++i) {
                    expected[0].push(null);
                }

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });
    });

    context('column metadata', () => {
        context('signed and unsigned values', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (sint INT, uint INT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1, 1)')
                    .execute();
            });

            it('allows to determine if a field is signed or not', () => {
                let metadata = [];

                return session.sql('SELECT * FROM test')
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        /* eslint-disable no-unused-expressions */
                        expect(metadata[0].isNumberSigned()).to.be.true;
                        expect(metadata[1].isNumberSigned()).to.be.false;
                        /* eslint-enable no-unused-expressions */
                    });
            });
        });

        context('padded values', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (rchar CHAR(5), vchar VARCHAR(5))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo\', \'bar\')')
                    .execute();
            });

            it('allows to determine if a field is padded or not', () => {
                let metadata = [];

                return session.sql('SELECT * FROM test')
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        /* eslint-disable no-unused-expressions */
                        expect(metadata[0].isPadded()).to.be.true;
                        expect(metadata[1].isPadded()).to.be.false;
                        /* eslint-enable no-unused-expressions */
                    });
            });
        });

        context('table metadata', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (vchar VARCHAR(3))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql("INSERT INTO test VALUES ('foo')")
                    .execute();
            });

            it('decodes the table name in the column metadata', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        return expect(res.getColumns()[0].getTableName()).to.equal('test');
                    });
            });

            it('decodes the schema name in the column metadata', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        return expect(res.getColumns()[0].getSchemaName()).to.equal(schema.getName());
                    });
            });
        });
    });

    context('tables in the schema', () => {
        let schema;

        beforeEach('set schema', () => {
            schema = session.getDefaultSchema();
        });

        it('checks if a table exists in the database', () => {
            return session.sql('CREATE TABLE foo (name VARCHAR(3))')
                .execute()
                .then(() => schema.getTable('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.true);
        });

        it('distinguishes tables from collections', () => {
            return session.sql('CREATE TABLE foo (name VARCHAR(3))')
                .execute()
                .then(() => schema.getCollection('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.false);
        });
    });

    context('table views', () => {
        const tableName = 'test';
        const viewName = 'v_test';

        beforeEach('create a table', () => {
            return session.sql(`CREATE TABLE ${tableName} (quantity INT, price INT)`)
                .execute();
        });

        beforeEach('create a view on the table', () => {
            return session.sql(`CREATE VIEW ${viewName} AS SELECT quantity, price, quantity*price AS VALUE FROM ${tableName}`)
                .execute();
        });

        it('checks if a table is not a view', () => {
            return session.getSchema(schema.getName()).getTable(tableName)
                .isView()
                .then(res => {
                    return expect(res).to.be.false;
                });
        });

        it('checks if a table is a view', () => {
            return session.getSchema(schema.getName()).getTable(viewName)
                .isView()
                .then(res => {
                    return expect(res).to.be.true;
                });
        });
    });

    context('date and time manipulation', () => {
        context('BUG#35690736 date unit encoding', () => {
            beforeEach('create table', async () => {
                await session.sql(`CREATE TABLE test (
                        name VARCHAR(3),
                        createdAt DATE)`)
                    .execute();
            });

            beforeEach('add fixtures', async () => {
                await session.sql("INSERT INTO test (name, createdAt) values ('foo', CURDATE())")
                    .execute();
                await session.sql("INSERT INTO test (name, createdAt) values ('bar', DATE_ADD(CURDATE(), INTERVAL 3 DAY))")
                    .execute();
            });

            it('retrieves the appropriate data within a given temporal range', async () => {
                const diff = 3;
                const now = new Date();
                const then = new Date();
                then.setUTCDate(now.getUTCDate() + diff);
                then.setUTCHours(0);
                then.setUTCMinutes(0);
                then.setUTCSeconds(0);
                then.setUTCMilliseconds(0);
                const want = [['bar', then]];

                const res = await schema.getTable('test')
                    .select()
                    .where(`createdAt > CURDATE() + INTERVAL ${diff - 1} DAY`)
                    .execute();
                const got = res.fetchAll();

                expect(got).to.deep.equal(want);
            });
        });
    });
});
