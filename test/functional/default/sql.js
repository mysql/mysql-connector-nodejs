'use strict';

/* eslint-env node, mocha */

const config = require('../../config');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const path = require('path');

describe('raw SQL', () => {
    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema);
    });

    afterEach('delete default schema', () => {
        return fixtures.dropSchema(config.schema);
    });

    context('BUG#30162858', () => {
        it('maps a MySQL BLOB to a Node.js Buffer', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const bin = new Buffer('foo');
            const expected = [[bin]];
            const actual = [];

            return mysqlx.getSession(config)
                .then(session => {
                    return session.sql('CREATE TABLE test (bin BLOB)')
                        .execute()
                        .then(() => session.sql(`INSERT INTO test (bin) VALUES (x'${bin.toString('hex')}')`).execute())
                        .then(() => session.sql('SELECT * FROM test').execute(row => actual.push(row)))
                        .then(() => expect(actual).to.deep.equal(expected))
                        .then(() => session.close());
                });
        });
    });

    context('result set API', () => {
        let session;

        beforeEach('create session', () => {
            return mysqlx.getSession(config)
                .then(s => {
                    session = s;
                });
        });

        afterEach('close session', () => {
            return session.close();
        });

        context('operation outcomes', () => {
            it('checks if the result set contains additional data', () => {
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
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
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal([1, 2.2]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves each record in the result set', () => {
                return session.sql(`SELECT 'foo' AS s1_m1, 'bar' AS s1_m2`)
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'bar']);
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('retrieves all the records at once in the result set', () => {
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
                    .execute()
                    .then(result => {
                        const first = result.fetchAll();
                        expect(first).to.deep.equal([[1, 2.2]]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves the column metadata for each row', () => {
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
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
                return session.sql(`DROP PROCEDURE multi`);
            });

            it('retrieves the first record in the result set', () => {
                return session.sql(`CALL multi()`)
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal(['foo', 'pending']);

                        expect(result.nextResult()).to.equal(true);
                    });
            });

            it('retrieves each item in the result sets', () => {
                return session.sql(`CALL multi()`)
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
                return session.sql(`CALL multi()`)
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
                return session.sql(`CALL multi()`)
                    .execute()
                    .then(result => {
                        const first = result.toArray();
                        expect(first).to.deep.equal([[['foo', 'pending'], ['bar', 'pending']], [['baz', 'blocked']], [[1, 2.2]]]);

                        expect(result.nextResult()).to.equal(true);
                    });
            });

            it('returns the column metadata for each row', () => {
                return session.sql(`CALL multi()`)
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
                return session.sql(`DROP PROCEDURE multi`);
            });

            it('correctly consumes empty result sets', () => {
                return session.sql(`CALL multi()`)
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
            /* eslint-disable node/no-deprecated-api */
            const bin1 = new Buffer('foo');
            const bin2 = new Buffer('bar');
            /* eslint-enable node/no-deprecated-api */

            const expected = [[bin2]];
            const actual = [];

            return mysqlx.getSession(config)
                .then(session => {
                    return session.sql('CREATE TABLE test (bin BLOB)')
                        .execute()
                        .then(() => session.sql(`INSERT INTO test (bin) VALUES (x'${bin1.toString('hex')}')`).execute())
                        .then(() => session.sql('UPDATE test SET bin = ?').bind(bin2).execute())
                        .then(() => session.sql('SELECT * FROM test').execute(row => actual.push(row)))
                        .then(() => expect(actual).to.deep.equal(expected))
                        .then(() => session.close());
                });
        });
    });

    context('BUG#30401962 affected items', () => {
        let session;

        beforeEach('create session in the default database', () => {
            return mysqlx.getSession(config)
                .then(s => {
                    session = s;
                });
        });

        beforeEach('create table', () => {
            return session.sql('CREATE TABLE test (name VARCHAR(4))')
                .execute();
        });

        afterEach('close session', () => {
            return session.close();
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
        let session;

        beforeEach('create session', () => {
            return mysqlx.getSession(config)
                .then(s => {
                    session = s;
                });
        });

        afterEach('close session', () => {
            return session.close();
        });

        context('BIT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value BIT)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (b'1')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('BIT'));
            });
        });

        context('TINYINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value1 TINYINT, value2 TINYINT SIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (-1, 1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (value TINYINT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED TINYINT'));
            });
        });

        context('SMALLINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value1 SMALLINT, value2 SMALLINT SIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (-1, 1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (value SMALLINT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED SMALLINT'));
            });
        });

        context('MEDIUMINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value1 MEDIUMINT, value2 MEDIUMINT SIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (-1, 1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (value MEDIUMINT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED MEDIUMINT'));
            });
        });

        context('INT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value1 INT, value2 INT SIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (-1, 1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (value INT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED INT'));
            });
        });

        context('BIGINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value1 BIGINT, value2 BIGINT SIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (-1, 1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => {
                        const columns = res.getColumns();

                        expect(columns[0].getType()).to.equal('BIGINT');
                        expect(columns[1].getType()).to.equal('BIGINT');
                    });
            });
        });

        context('UNSIGNED BIGINT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value BIGINT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED BIGINT'));
            });
        });

        context('FLOAT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value FLOAT)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1.23)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('FLOAT'));
            });
        });

        context('UNSIGNED FLOAT', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value FLOAT UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1.23)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED FLOAT'));
            });
        });

        context('DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DECIMAL(5,2))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (5.67)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DECIMAL'));
            });
        });

        context('UNSIGNED DECIMAL', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DECIMAL(5,2) UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (5.67)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED DECIMAL'));
            });
        });

        context('DOUBLE', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DOUBLE)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1.23)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DOUBLE'));
            });
        });

        context('UNSIGNED DOUBLE', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DOUBLE UNSIGNED)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (1.23)`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('UNSIGNED DOUBLE'));
            });
        });

        context('JSON', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value JSON)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('{"foo":"bar"}')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('JSON'));
            });
        });

        context('STRING', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (vc CHAR(3), vv VARCHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('foo', 'foo')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (vb BINARY(3), vv VARBINARY(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('foo', 'foo')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
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
                return session.sql(`CREATE TABLE test (value TIME)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('23:45')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('TIME'));
            });
        });

        context('DATE', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DATE)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('2020-03-30')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DATE'));
            });
        });

        context('DATETIME', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value DATETIME)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('2020-03-30 18:33:38')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('DATETIME'));
            });
        });

        context('TIMESTAMP', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value TIMESTAMP)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('2020-03-30 18:33:38.123456')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('TIMESTAMP'));
            });
        });

        context('SET', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value SET('foo', 'bar'))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('foo')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('SET'));
            });
        });

        context('ENUM', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value ENUM('foo', 'bar'))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES ('foo')`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('ENUM'));
            });
        });

        context('GEOMETRY', () => {
            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE test (value GEOMETRY)`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO test VALUES (ST_GeomFromText('POINT(1 1)'))`)
                    .execute();
            });

            it('returns the correct name of the column data type', () => {
                return session.sql(`SELECT * FROM test`)
                    .execute()
                    .then(res => expect(res.getColumns()[0].getType()).to.equal('GEOMETRY'));
            });
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'sql-statement.js');
        const statement = `SELECT name AS col FROM ${config.schema}.test`;

        let session;

        beforeEach('create session', () => {
            return mysqlx.getSession(config)
                .then(s => {
                    session = s;
                });
        });

        beforeEach('create a table', () => {
            return session.sql(`CREATE TABLE ${config.schema}.test (name VARCHAR(3))`)
                .execute();
        });

        beforeEach('add table data', () => {
            return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                .execute();
        });

        afterEach('close session', () => {
            return session.close();
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
                    expect(columnMetadata.schema).to.equal(config.schema);
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
