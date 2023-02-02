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

const config = require('../../config');
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const path = require('path');

describe('executing raw SQL statements', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let session, schema;

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

    afterEach('delete default schema', () => {
        return fixtures.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('BUG#30162858', () => {
        it('maps a MySQL BLOB to a Node.js Buffer', () => {
            const bin = Buffer.from('foo');
            const expected = [[bin]];
            const actual = [];

            return session.sql('CREATE TABLE test (bin BLOB)')
                .execute()
                .then(() => session.sql(`INSERT INTO test (bin) VALUES (x'${bin.toString('hex')}')`).execute())
                .then(() => session.sql('SELECT * FROM test').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected))
                .then(() => session.close());
        });
    });

    context('callback API', () => {
        let session;

        beforeEach('create session', () => {
            const defaultConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(defaultConfig)
                .then(s => {
                    session = s;
                });
        });

        afterEach('close session', () => {
            return session.close();
        });

        context('multiple result sets', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (name VARCHAR(4), status ENUM("pending", "active", "blocked") NOT NULL)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test (name) VALUES ("foo"), ("bar")')
                    .execute();
            });

            beforeEach('create procedure', () => {
                return session.sql(`
                        CREATE PROCEDURE multi() BEGIN
                            SELECT name AS s1_m1, status AS s2_m1 FROM test;
                            SELECT "baz" AS s1_m2, "blocked" AS s2_m2;
                            SELECT 1 AS s1_m3, 2.2 AS s2_m3;
                        END`)
                    .execute();
            });

            afterEach('drop procedure', () => {
                return session.sql('DROP PROCEDURE multi')
                    .execute();
            });

            it('executes the metadata handler once for each result set', () => {
                const noop = () => {};
                let resultSetCount = 0;

                return session.sql('CALL multi()')
                    .execute(noop, columns => {
                        resultSetCount += 1;

                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal(`s1_m${resultSetCount}`);
                        expect(columns[1].getColumnLabel()).to.equal(`s2_m${resultSetCount}`);
                    })
                    .then(() => {
                        return expect(resultSetCount).to.equal(3);
                    });
            });
        });
    });

    context('result set API', () => {
        context('operation outcomes', () => {
            it('checks if the result set contains additional data', () => {
                return session.sql('SELECT 1 AS s1_m1, 2.2 AS s1_m2')
                    .execute()
                    .then(result => expect(result.hasData()).to.equal(true));
            });

            it('checks if the result set does not contain additional data', () => {
                return session.sql('CREATE TABLE test (name VARCHAR(4))')
                    .execute()
                    .then(() => {
                        return session.sql('INSERT INTO test VALUES ("foo")')
                            .execute();
                    })
                    .then(result => expect(result.hasData()).to.equal(false));
            });
        });

        context('single result sets', () => {
            it('retrieves the first record in the result set', () => {
                return session.sql('SELECT 1 AS s1_m1, 2.2 AS s1_m2')
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal([1, 2.2]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves each record in the result set', () => {
                return session.sql('SELECT \'foo\' AS s1_m1, \'bar\' AS s1_m2')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'bar']);
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('retrieves all the records at once in the result set', () => {
                return session.sql('SELECT 1 AS s1_m1, 2.2 AS s1_m2')
                    .execute()
                    .then(result => {
                        const first = result.fetchAll();
                        expect(first).to.deep.equal([[1, 2.2]]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves the column metadata for each row', () => {
                return session.sql('SELECT 1 AS s1_m1, 2.2 AS s1_m2')
                    .execute()
                    .then(result => {
                        const columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m1');
                        expect(columns[1].getColumnLabel()).to.equal('s1_m2');
                    });
            });
        });

        context('multiple result sets', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (name VARCHAR(4), status ENUM("pending", "active", "blocked") NOT NULL)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test (name) VALUES ("foo"), ("bar")')
                    .execute();
            });

            beforeEach('create procedure', () => {
                return session.sql(`
                        CREATE PROCEDURE multi() BEGIN
                            SELECT name AS s1_m1, status AS s2_m1 FROM test;
                            SELECT "baz" AS s1_m2, "blocked" AS s2_m2;
                            SELECT 1 AS s1_m3, 2.2 AS s2_m3;
                        END`)
                    .execute();
            });

            afterEach('drop procedure', () => {
                return session.sql('DROP PROCEDURE multi')
                    .execute();
            });

            it('retrieves the first record in the result set', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal(['foo', 'pending']);

                        expect(result.nextResult()).to.equal(true);
                    });
            });

            it('retrieves each item in the result sets', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'pending']);
                        expect(result.fetchOne()).to.deep.equal(['bar', 'pending']);

                        expect(result.nextResult()).to.equal(true);
                        expect(result.fetchOne()).to.deep.equal(['baz', 'blocked']);

                        expect(result.nextResult()).to.equal(true);
                        expect(result.fetchOne()).to.deep.equal([1, 2.2]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves all the items in the result sets', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        let item = result.fetchAll();
                        expect(item).to.deep.equal([['foo', 'pending'], ['bar', 'pending']]);

                        expect(result.nextResult()).to.equal(true);

                        item = result.fetchAll();
                        expect(item).to.deep.equal([['baz', 'blocked']]);

                        expect(result.nextResult()).to.equal(true);

                        item = result.fetchAll();
                        expect(item).to.deep.equal([[1, 2.2]]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves an array of result sets', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        const first = result.toArray();
                        expect(first).to.deep.equal([[['foo', 'pending'], ['bar', 'pending']], [['baz', 'blocked']], [[1, 2.2]]]);

                        expect(result.nextResult()).to.equal(true);
                    });
            });

            it('returns the column metadata for each row', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        let columns = result.getColumns();

                        expect(columns).to.have.lengthOf(2);

                        expect(columns[0].getColumnLabel()).to.equal('s1_m1');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m1');

                        expect(result.nextResult()).to.equal(true);

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m2');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m2');

                        expect(result.nextResult()).to.equal(true);

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m3');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m3');
                    });
            });

            it('returns undefined when consuming an item from a result set that was already entirely consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'pending']);
                        expect(result.fetchOne()).to.deep.equal(['bar', 'pending']);
                        return expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('returns an empty array when consuming a result set that was already consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchAll()).to.deep.equal([['foo', 'pending'], ['bar', 'pending']]);
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });

            it('does not implicitely move the cursor to the next result set when one is consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchAll()).to.deep.equal([['foo', 'pending'], ['bar', 'pending']]);
                        expect(result.nextResult()).to.equal(true);
                        expect(result.fetchAll()).to.deep.equal([['baz', 'blocked']]);
                        expect(result.nextResult()).to.equal(true);
                        expect(result.fetchAll()).to.deep.equal([[1, 2.2]]);
                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('moves the cursor explicitely to the next result set', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'pending']);
                        expect(result.nextResult()).to.equal(true);
                        expect(result.nextResult()).to.equal(true);
                        expect(result.nextResult()).to.equal(false);
                        return expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('keeps the metadata for each result set being consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        let columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m1');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m1');

                        result.fetchOne();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m1');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m1');

                        result.nextResult();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m2');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m2');

                        result.fetchAll();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m2');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m2');

                        result.nextResult();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(2);
                        expect(columns[0].getColumnLabel()).to.equal('s1_m3');
                        expect(columns[1].getColumnLabel()).to.equal('s2_m3');

                        result.nextResult();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(0);

                        result.nextResult();

                        columns = result.getColumns();
                        expect(columns).to.have.lengthOf(0);
                    });
            });
        });

        context('BUG#31037211', () => {
            beforeEach('create procedure', () => {
                return session.sql(`
                        CREATE PROCEDURE multi() BEGIN
                            SELECT 'foo';
                            SELECT 'bar' WHERE 1 = 0;
                            SELECT 'baz';
                        END`)
                    .execute();
            });

            afterEach('drop procedure', () => {
                return session.sql('DROP PROCEDURE multi')
                    .execute();
            });

            it('correctly consumes empty result sets', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo']);

                        expect(result.nextResult()).to.equal(true);
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;

                        expect(result.nextResult()).to.equal(true);
                        expect(result.fetchOne()).to.deep.equal(['baz']);

                        expect(result.nextResult()).to.equal(false);
                    });
            });
        });
    });

    context('BUG#30163003', () => {
        it('maps a Node.js Buffer to a MySQL BLOB', () => {
            const bin1 = Buffer.from('foo');
            const bin2 = Buffer.from('bar');

            const expected = [[bin2]];
            const actual = [];

            return session.sql('CREATE TABLE test (bin BLOB)')
                .execute()
                .then(() => session.sql(`INSERT INTO test (bin) VALUES (x'${bin1.toString('hex')}')`).execute())
                .then(() => session.sql('UPDATE test SET bin = ?').bind(bin2).execute())
                .then(() => session.sql('SELECT * FROM test').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected))
                .then(() => session.close());
        });
    });

    context('BUG#30401962 affected items', () => {
        beforeEach('create table', () => {
            return session.sql('CREATE TABLE test (name VARCHAR(4))')
                .execute();
        });

        context('INSERT', () => {
            it('returns the number of rows that have been inserted into the table', () => {
                return session.sql("INSERT INTO test VALUES ('foo'), ('bar'), ('baz')")
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('UPDATE', () => {
            beforeEach('add fixtures', () => {
                return session.sql("INSERT INTO test VALUES ('foo'), ('bar'), ('baz')")
                    .execute();
            });

            context('without limit', () => {
                it('returns the number of documents that have been updated in the table', () => {
                    return session.sql('UPDATE test SET name = ?')
                        .bind('quux')
                        .execute()
                        .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
                });
            });

            context('with limit', () => {
                it('returns the number of documents that have been updated in the table', () => {
                    const limit = 2;

                    return session.sql('UPDATE test SET name = ? LIMIT ?')
                        .bind(['quux', limit])
                        .execute()
                        .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
                });
            });
        });

        context('DELETE', () => {
            beforeEach('add fixtures', () => {
                return session.sql("INSERT INTO test VALUES ('foo'), ('bar'), ('baz')")
                    .execute();
            });

            context('without limit', () => {
                it('returns the number of documents that have been updated in the table', () => {
                    return session.sql('DELETE FROM test')
                        .execute()
                        .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
                });
            });

            context('with limit', () => {
                it('returns the number of documents that have been updated in the table', () => {
                    const limit = 2;

                    return session.sql('DELETE FROM test LIMIT ?')
                        .bind(limit)
                        .execute()
                        .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
                });
            });
        });
    });

    context('BUG#30922711 column types', () => {
        context('BIT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value BIT)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (b\'1\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('BIT'));
            });
        });

        context('TINYINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value1 TINYINT, value2 TINYINT SIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-1, 1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('TINYINT');
                        expect(columns[1].getType()).to.equal('TINYINT');
                    });
            });
        });

        context('UNSIGNED TINYINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value TINYINT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED TINYINT'));
            });
        });

        context('SMALLINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value1 SMALLINT, value2 SMALLINT SIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-1, 1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('SMALLINT');
                        expect(columns[1].getType()).to.equal('SMALLINT');
                    });
            });
        });

        context('UNSIGNED SMALLINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value SMALLINT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED SMALLINT'));
            });
        });

        context('MEDIUMINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value1 MEDIUMINT, value2 MEDIUMINT SIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-1, 1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('MEDIUMINT');
                        expect(columns[1].getType()).to.equal('MEDIUMINT');
                    });
            });
        });

        context('UNSIGNED MEDIUMINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value MEDIUMINT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED MEDIUMINT'));
            });
        });

        context('INT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value1 INT, value2 INT SIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-1, 1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('INT');
                        expect(columns[1].getType()).to.equal('INT');
                    });
            });
        });

        context('UNSIGNED INT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value INT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED INT'));
            });
        });

        context('BIGINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value1 BIGINT, value2 BIGINT SIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (-1, 1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('BIGINT');
                        expect(columns[1].getType()).to.equal('BIGINT');
                    });
            });

            it('returns unsafe values as strings', () => {
                const unsafe = Number.MIN_SAFE_INTEGER - 1;

                return session.sql('INSERT INTO test (value1) VALUES (?)')
                    .bind(unsafe)
                    .execute()
                    .then(() => {
                        return session.sql('SELECT value1 from test')
                            .execute();
                    })
                    .then(res => {
                        expect(res.fetchOne()).to.deep.equal([-1]);
                        return expect(res.fetchOne()).to.deep.equal([`${unsafe}`]);
                    });
            });
        });

        context('UNSIGNED BIGINT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value BIGINT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED BIGINT'));
            });

            it('returns unsafe values as strings', () => {
                const unsafe = Number.MAX_SAFE_INTEGER + 1;

                return session.sql('INSERT INTO test VALUES (?)')
                    .bind(unsafe)
                    .execute()
                    .then(() => {
                        return session.sql('SELECT * from test')
                            .execute();
                    })
                    .then(res => {
                        expect(res.fetchOne()).to.deep.equal([1]);
                        return expect(res.fetchOne()).to.deep.equal([`${unsafe}`]);
                    });
            });
        });

        context('FLOAT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value FLOAT)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1.23)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('FLOAT'));
            });
        });

        context('UNSIGNED FLOAT', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value FLOAT UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1.23)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED FLOAT'));
            });
        });

        context('DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DECIMAL(5,2))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (5.67)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DECIMAL'));
            });
        });

        context('UNSIGNED DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DECIMAL(5,2) UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (5.67)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED DECIMAL'));
            });
        });

        context('DOUBLE', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DOUBLE)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1.23)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DOUBLE'));
            });
        });

        context('UNSIGNED DOUBLE', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DOUBLE UNSIGNED)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (1.23)')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED DOUBLE'));
            });
        });

        context('JSON', () => {
            const signedBigInt = '-9223372036854775808';
            const unsignedBigInt = '18446744073709551615';

            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value JSON)')
                    .execute();
            });

            beforeEach('populate column', () => {
                return session.sql(`INSERT INTO test (value) VALUES ('{ "signedBigInt": ${signedBigInt}, "unsignedBigInt": ${unsignedBigInt} }')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('JSON'));
            });

            context('BUG#34728259', () => {
                it('returns unsafe numeric field values as strings', () => {
                    return session.sql('SELECT value FROM test')
                        .execute()
                        .then(res => {
                            return expect(res.fetchOne()).to.deep.equal([{ signedBigInt, unsignedBigInt }]);
                        });
                });
            });
        });

        context('STRING', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (vc CHAR(3), vv VARCHAR(3))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo\', \'foo\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('STRING');
                        expect(columns[1].getType()).to.equal('STRING');
                    });
            });
        });

        context('BYTES', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (vb BINARY(3), vv VARBINARY(3))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo\', \'foo\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('BYTES');
                        expect(columns[1].getType()).to.equal('BYTES');
                    });
            });
        });

        context('TIME', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value TIME)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'23:45\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('TIME'));
            });
        });

        context('DATE', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DATE)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'2020-03-30\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DATE'));
            });
        });

        context('DATETIME', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value DATETIME)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'2020-03-30 18:33:38\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DATETIME'));
            });
        });

        context('TIMESTAMP', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value TIMESTAMP)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'2020-03-30 18:33:38.123456\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('TIMESTAMP'));
            });
        });

        context('SET', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value SET(\'foo\', \'bar\'))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('SET'));
            });
        });

        context('ENUM', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value ENUM(\'foo\', \'bar\'))')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (\'foo\')')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('ENUM'));
            });
        });

        context('GEOMETRY', () => {
            beforeEach('create table', () => {
                return session.sql('CREATE TABLE test (value GEOMETRY)')
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql('INSERT INTO test VALUES (ST_GeomFromText(\'POINT(1 1)\'))')
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql('SELECT * FROM test')
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('GEOMETRY'));
            });
        });
    });

    context('BUG#32750927 placeholder value refresh', () => {
        it('allows to re-use a statement with different placeholder values', () => {
            return mysqlx.getSession(config)
                .then(session => {
                    const statement = session.sql('select ?');

                    return statement.bind('foo')
                        .execute()
                        .then(res => {
                            return expect(res.fetchOne()).to.deep.equal(['foo']);
                        })
                        .then(() => {
                            return statement.bind('bar')
                                .execute();
                        })
                        .then(res => {
                            return expect(res.fetchOne()).to.deep.equal(['bar']);
                        })
                        .then(() => {
                            return session.close();
                        });
                });
        });

        it('allows to re-use a statement with the same placeholder values', () => {
            return mysqlx.getSession(config)
                .then(session => {
                    const statement = session.sql('select ?').bind('foo');

                    return statement.execute()
                        .then(res => {
                            return expect(res.fetchOne()).to.deep.equal(['foo']);
                        })
                        .then(() => {
                            return statement.execute();
                        })
                        .then(res => {
                            return expect(res.fetchOne()).to.deep.equal(['foo']);
                        })
                        .then(() => {
                            return session.close();
                        });
                });
        });
    });

    context('BUG#33940584', () => {
        it('fails with the corresponding server error if the placeholder value is not supported', () => {
            return session.sql('CREATE TABLE test (name VARCHAR(3))')
                .execute()
                .then(() => {
                    return session.sql('SELECT * FROM test WHERE name = ?')
                        .bind({ name: 'foo' })
                        .execute();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_INVALID_DATA);
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

            return session.sql('select * from test')
                .execute()
                .then(res => {
                    return expect(res.fetchAll()).to.deep.equal(expected);
                });
        });
    });

    context('warnings', () => {
        beforeEach('create table', () => {
            return session.sql('CREATE TABLE test (a TINYINT NOT NULL, b VARCHAR(3))')
                .execute();
        });

        it('returns any warning generated by the server for a given operation', () => {
            return session.sql("INSERT IGNORE INTO test VALUES (10, 'foo'), (NULL, 'bar')")
                .execute()
                .then(res => {
                    expect(res.getWarningsCount()).to.equal(1);

                    const warnings = res.getWarnings();
                    expect(warnings).to.have.lengthOf(1);
                    expect(warnings[0].level).to.equal(2);
                    expect(warnings[0].code).to.equal(1048);
                    expect(warnings[0].msg).to.equal("Column 'a' cannot be null");
                });
        });
    });

    context('upstream unsafe integer values', () => {
        const unsafePositive = '18446744073709551615';
        const unsafeNegative = '-9223372036854775808';

        context('to be saved in a column', () => {
            beforeEach('create a table', async () => {
                await session.sql('CREATE TABLE test (unsafePositive BIGINT UNSIGNED, unsafeNegative BIGINT SIGNED)')
                    .execute();
            });

            context('specified with a JavaScript string', () => {
                it('saves values interpolated in the SQL string without losing precision', async () => {
                    const want = [`${unsafePositive}`, `${unsafeNegative}`];

                    await session.sql(`INSERT INTO test (unsafePositive, unsafeNegative) VALUES (${unsafePositive}, ${unsafeNegative})`)
                        .execute();

                    const res = await session.sql('SELECT unsafePositive, unsafeNegative FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });

                it('saves values provided as an ordinal placeholder assignment without losing precision', async () => {
                    const want = [`${unsafePositive}`, `${unsafeNegative}`];

                    await session.sql('INSERT INTO test (unsafePositive, unsafeNegative) VALUES (?, ?)')
                        .bind(unsafePositive, unsafeNegative)
                        .execute();

                    const res = await session.sql('SELECT unsafePositive, unsafeNegative FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });
            });

            context('specified with a JavaScript BigInt', () => {
                it('saves values interpolated in the SQL string without losing precision', async () => {
                    const want = [`${unsafePositive}`, `${unsafeNegative}`];

                    await session.sql(`INSERT INTO test (unsafePositive, unsafeNegative) VALUES (${BigInt(unsafePositive)}, ${BigInt(unsafeNegative)})`)
                        .execute();

                    const res = await session.sql('SELECT unsafePositive, unsafeNegative FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });

                it('saves values provided as an ordinal placeholder assignment without losing precision', async () => {
                    const want = [`${unsafePositive}`, `${unsafeNegative}`];

                    await session.sql('INSERT INTO test (unsafePositive, unsafeNegative) VALUES (?, ?)')
                        .bind(BigInt(unsafePositive), BigInt(unsafeNegative))
                        .execute();

                    const res = await session.sql('SELECT unsafePositive, unsafeNegative FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });
            });
        });

        context('to be saved in a document field', () => {
            beforeEach('create a table', async () => {
                await session.sql('CREATE TABLE test (doc JSON)')
                    .execute();
            });

            context('specified with a JavaScript string', () => {
                it('saves values interpolated in the SQL string without losing precision', async () => {
                    const doc = `{ "unsafePositive": ${unsafePositive}, "unsafeNegative": ${unsafeNegative} }`;
                    const want = [{ unsafePositive, unsafeNegative }];

                    await session.sql(`INSERT INTO test (doc) VALUES ('${doc}')`)
                        .execute();

                    const res = await session.sql('SELECT doc FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });

                it('saves values provided as an ordinal placeholder assignment without losing precision', async () => {
                    const doc = `{ "unsafePositive": ${unsafePositive}, "unsafeNegative": ${unsafeNegative} }`;
                    const want = [{ unsafePositive, unsafeNegative }];

                    await session.sql('INSERT INTO test (doc) VALUES (?)')
                        .bind(doc)
                        .execute();

                    const res = await session.sql('SELECT doc FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });
            });

            context('specified with a JavaScript BigInt', () => {
                it('saves values interpolated in the SQL string without losing precision', async () => {
                    const doc = `{ "unsafePositive": ${BigInt(unsafePositive)}, "unsafeNegative": ${BigInt(unsafeNegative)} }`;
                    const want = [{ unsafePositive, unsafeNegative }];

                    await session.sql(`INSERT INTO test (doc) VALUES ('${doc}')`)
                        .execute();

                    const res = await session.sql('SELECT doc FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });

                it('saves values provided as an ordinal placeholder assignment without losing precision', async () => {
                    const doc = `{ "unsafePositive": ${BigInt(unsafePositive)}, "unsafeNegative": ${BigInt(unsafeNegative)} }`;
                    const want = [{ unsafePositive, unsafeNegative }];

                    await session.sql('INSERT INTO test (doc) VALUES (?)')
                        .bind(doc)
                        .execute();

                    const res = await session.sql('SELECT doc FROM test')
                        .execute();

                    expect(res.fetchOne()).to.deep.equal(want);
                });
            });
        });
    });

    context('in a result set', () => {
        const safeNegative = Number.MIN_SAFE_INTEGER + 1;
        const safePositive = Number.MAX_SAFE_INTEGER - 1;
        const unsafeNegative = '-9223372036854775808';
        const unsafePositive = '18446744073709551615';

        beforeEach('create a table', async () => {
            await session.sql('CREATE TABLE test (safePositive BIGINT UNSIGNED, safeNegative BIGINT, unsafePositive BIGINT UNSIGNED, unsafeNegative BIGINT)')
                .execute();
        });

        beforeEach('populate the table', async () => {
            await session.sql('INSERT INTO test (safeNegative, safePositive, unsafeNegative, unsafePositive) VALUES (?, ?, ?, ?)')
                .bind(safeNegative, safePositive, unsafeNegative, unsafePositive)
                .execute();
        });

        context('consumed using a pull-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [`${safeNegative}`, `${safePositive}`, unsafeNegative, unsafePositive];

                const res = await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [BigInt(safeNegative), BigInt(safePositive), BigInt(unsafeNegative), BigInt(unsafePositive)];

                const res = await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [safeNegative, safePositive, unsafeNegative, unsafePositive];

                const res = await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [safeNegative, safePositive, BigInt(unsafeNegative), BigInt(unsafePositive)];

                const res = await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [safeNegative, safePositive, unsafeNegative, unsafePositive];

                const res = await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });

        context('consumed using a pull-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[`${safeNegative}`, `${safePositive}`, unsafeNegative, unsafePositive]];
                const got = [];

                await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[BigInt(safeNegative), BigInt(safePositive), BigInt(unsafeNegative), BigInt(unsafePositive)]];
                const got = [];

                await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, unsafeNegative, unsafePositive]];
                const got = [];

                await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, BigInt(unsafeNegative), BigInt(unsafePositive)]];
                const got = [];

                await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = [[safeNegative, safePositive, unsafeNegative, unsafePositive]];
                const got = [];

                await session.sql('SELECT safeNegative, safePositive, unsafeNegative, unsafePositive FROM test')
                    .execute(row => got.push(row));

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'sql-statement.js');
        const statement = `SELECT name AS col FROM \`${baseConfig.schema}\`.test`;

        beforeEach('create a table', () => {
            return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (name VARCHAR(3))`)
                .execute();
        });

        beforeEach('add table data', () => {
            return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                .execute();
        });

        it('logs the statement data sent to the server', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Sql.StmtExecute', script, [statement])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const stmtExecute = proc.logs[0];
                    expect(stmtExecute).to.contain.keys('namespace', 'stmt', 'compact_metadata');
                    expect(stmtExecute.namespace).to.equal('sql');
                });
        });

        it('logs the result set column metadata sent by the server', () => {
            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.ColumnMetaData', script, [statement])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const columnMetadata = proc.logs[0];
                    expect(columnMetadata).to.contain.keys('type', 'name', 'original_name', 'table', 'original_table', 'schema', 'catalog', 'collation', 'fractional_digits', 'length', 'flags');
                    expect(columnMetadata.type).to.equal('BYTES');
                    expect(columnMetadata.name).to.equal('col');
                    expect(columnMetadata.original_name).to.equal('name');
                    expect(columnMetadata.table).to.equal('test');
                    expect(columnMetadata.original_table).to.equal('test');
                    expect(columnMetadata.schema).to.equal(baseConfig.schema);
                    expect(columnMetadata.catalog).to.equal('def'); // always "def"
                    expect(columnMetadata.collation).to.equal(255); // always "255"
                    expect(columnMetadata.fractional_digits).to.equal(0);
                    expect(columnMetadata.length).to.equal(12);
                    expect(columnMetadata.flags).to.equal(0);
                });
        });

        it('logs the result set row data sent by the server', () => {
            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.Row', script, [statement])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);
                    expect(proc.logs[0]).to.contain.keys('fields');
                    expect(proc.logs[0].fields).to.deep.equal(['foo']);
                });
        });
    });
});
