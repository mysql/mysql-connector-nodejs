'use strict';

/* eslint-env node, mocha */

const Column = require('../../../lib/DevAPI/Column');
const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

// TODO(Rui): extract tests into proper self-contained suites.
describe('relational miscellaneous tests', () => {
    let schema, session;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
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
                    expect(actual.meta[0]).to.be.an.instanceOf(Column);
                    expect(actual.meta[0].getType()).to.equal(1);
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('1');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.equal(1);
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
                    expect(actual.meta[0]).to.be.an.instanceOf(Column);
                    expect(actual.meta[0].getType()).to.equal(1);
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('1');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.equal(1);
                });
        });

        context('placeholder binding', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
                        name VARCHAR(5),
                        age TINYINT)`)
                    .execute();
            });

            it('binds values to query placeholders', () => {
                const rows = [];
                const expected = [['foo'], ['baz']];

                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (?, ?), (?, ?), (?, ?)`)
                    .bind('foo', 23, 'bar')
                    .bind([42, 'baz', 23])
                    .execute()
                    .then(() => {
                        return session
                            .sql(`SELECT name FROM ${schema.getName()}.test WHERE age < ?`)
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
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
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (
                        -128, 127, -32768, 32767, -8388608, 8388607, -2147483648, 2147483647, -9223372036854775808, 9223372036854775807)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                // Even the "stringified" value is not lossless.
                // https://github.com/google/protobuf/blob/9021f623e1420f513268a01a5ad43a23618a84ba/js/binary/decoder.js#L745
                const expected = [[-128, 127, -32768, 32767, -8388608, 8388607, -2147483648, 2147483647, '-9223372036854776000', '9223372036854776000']];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as UINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
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
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (bit_1 BIT, bit_2 BIT(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (b'1', b'111')`)
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
                        double_1 DOUBLE,
                        double_2 DOUBLE PRECISION (5, 4),
                        float_1 FLOAT(3, 2))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (
                        1.2345678910111213141516171819202, 1.23456789, 1.23456789)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[1.2345678910111213141516171819202, 1.2346, 1.23]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as BYTES', () => {
            context('BLOB columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (
                            a_tiny_blob TINYBLOB,
                            a_blob BLOB(5),
                            a_medium_blob MEDIUMBLOB,
                            a_long_blob LONGBLOB)`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("foo", "bar", "baz", "qux")`)
                        .execute();
                });

                it('decodes values correctly', () => {
                    // eslint-disable-next-line node/no-deprecated-api
                    const expected = [[new Buffer('foo'), new Buffer('bar'), new Buffer('baz'), new Buffer('qux')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('TEXT columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (
                            a_tiny_text TINYTEXT,
                            a_text TEXT(5),
                            a_medium_text MEDIUMTEXT,
                            a_long_text LONGTEXT)`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("foo", "bar", "baz", "qux")`)
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
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (
                            a_varbinary VARBINARY(5),
                            a_binary BINARY(5))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("foo", "bar")`)
                        .execute();
                });

                it('decodes values correctly', () => {
                    // BINARY length = byte size
                    // eslint-disable-next-line node/no-deprecated-api
                    const expected = [[new Buffer('foo'), new Buffer('bar\0\0')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => row && row.length && actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('variable and fixed size CHAR columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (
                            a_varchar VARCHAR(5),
                            a_char CHAR(5))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("foo", "bar")`)
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
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (
                            a_char CHAR(4),
                            a_binary BINARY(4))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("0", "0")`)
                        .execute();
                });

                it('decodes numeric values for columns of fixed-length datatypes that require padding', () => {
                    // BINARY length = byte size
                    // CHAR length = byte size * 4 (to accommodate UTF8)
                    // eslint-disable-next-line node/no-deprecated-api
                    const expected = [['0               ', new Buffer('0\0\0\0')]];
                    const actual = [];

                    return schema.getTable('test').select()
                        .execute(row => actual.push(row))
                        .then(() => expect(actual).to.deep.equal(expected));
                });
            });

            context('ENUM columns', () => {
                beforeEach('create table', () => {
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (a_enum ENUM('foo', 'bar', 'baz'))`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ("foo")`)
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
                    return session.sql(`CREATE TABLE ${schema.getName()}.test (a_geo GEOMETRY)`)
                        .execute();
                });

                beforeEach('add fixtures', () => {
                    return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (ST_GeomFromText('POINT(1 1)'))`)
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

        context.skip('values encoded as TIME', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (a_time TIME)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                // TODO(Rui): currently, the xplugin does not seem to return trailing fractional seconds.
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ('11 12:13:14'),  ('-12:13:14'), ('12:13:14'),
                        ('21 22:03'), ('-22:03'), ('22:03'), ('1 02'), ('-02'), ('02'), ('101112'), ('-101112'), (101112), (-101112), (8), (-8)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [
                    ['+276:13:14.000000'],
                    ['-12:13:14.000000'],
                    ['+12:13:14.000000'],
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
                        a_date DATE,
                        a_datetime DATETIME,
                        a_timestamp TIMESTAMP)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                // TODO(Rui): currently, the xplugin does not seem to return trailing fractional seconds.
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ('2018-02-18', '2018-02-18 12:33:17', '2018-02-18 12:33:17.123456')`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[new Date('2018-02-18'), new Date('2018-02-18T12:33:17'), 1518957197000]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
                        decimal_1 DECIMAL,
                        decimal_2 DECIMAL(3),
                        decimal_3 DECIMAL(3,2))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (-999.99, 999, 9.99)`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[-1000, 999, 9.99]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('values encoded as SET', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (a_set SET('foo', 'bar'))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ('foo,bar'), ('foo'), ('')`)
                    .execute();
            });

            it('decodes values correctly', () => {
                const expected = [[['foo', 'bar']], [['foo']], [[]]];
                const actual = [];

                return schema.getTable('test').select()
                    .execute(row => row && row.length && actual.push(row))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('NULL values', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${schema.getName()}.test (
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
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (sint INT, uint INT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES (1, 1)`)
                    .execute();
            });

            it('allows to determine if a field is signed or not', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${schema.getName()}.test`)
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
                return session.sql(`CREATE TABLE ${schema.getName()}.test (rchar CHAR(5), vchar VARCHAR(5))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${schema.getName()}.test VALUES ('foo', 'bar')`)
                    .execute();
            });

            it('allows to determine if a field is padded or not', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${schema.getName()}.test`)
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
    });

    context('table size', () => {
        beforeEach('ensure non-existing table', () => {
            return session.sql('DROP TABLE IF EXISTS test.noop')
                .execute();
        });

        beforeEach('create table', () => {
            return session.sql(`CREATE TABLE ${schema.getName()}.test (name VARCHAR(4))`)
                .execute();
        });

        beforeEach('add fixtures', () => {
            return schema.getTable('test').insert('name')
                .values('foo')
                .values('bar')
                .values('baz')
                .execute();
        });

        it('retrieves the total number of documents in a table', () => {
            return schema.getTable('test').count()
                .then(actual => expect(actual).to.equal(3));
        });

        it('fails if the table does not exist in the given schema', () => {
            return schema.getTable('noop').count()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Table '${schema.getName()}.noop' doesn't exist`));
        });
    });
});
