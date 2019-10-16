'use strict';

/* eslint-env node, mocha */

const config = require('../properties');
const expect = require('chai').expect;
const fixtures = require('../fixtures');
const mysqlx = require('../../');

describe('raw SQL', () => {
    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    afterEach('delete default schema', () => {
        return fixtures.deleteDefaultSchema();
    });

    context('using default schema with multiple authentication mechanisms', () => {
        let password, user;

        context('MYSQL41', () => {
            beforeEach('setup test account', () => {
                password = 'test_mnp_password';
                user = 'test_mnp_user';

                return fixtures.createAccount({ password, plugin: 'mysql_native_password', user });
            });

            afterEach('delete test account', () => {
                return fixtures.deleteAccount({ user });
            });

            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'MYSQL41', password, user });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('PLAIN', () => {
            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'PLAIN' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('SHA256_MEMORY', () => {
            beforeEach('make sure the password is already cached', () => {
                return mysqlx.getSession(config)
                    .then(session => session.close());
            });

            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'SHA256_MEMORY' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });
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

    context('result-set API', () => {
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
            it('checks if the result-set contains additional data', () => {
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
                    .execute()
                    .then(result => expect(result.hasData()).to.equal(true));
            });

            it('checks if the result-set does not contain additional data', () => {
                return session.sql('CREATE TABLE test (name VARCHAR(4))')
                    .execute()
                    .then(() => {
                        return session.sql('INSERT INTO test VALUES ("foo")')
                            .execute();
                    })
                    .then(result => expect(result.hasData()).to.equal(false));
            });
        });

        context('single result-sets', () => {
            it('retrieves the first record in the result-set', () => {
                return session.sql(`SELECT 1 AS s1_m1, 2.2 AS s1_m2`)
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal([1, 2.2]);

                        expect(result.nextResult()).to.equal(false);
                    });
            });

            it('retrieves each record in the result-set', () => {
                return session.sql(`SELECT 'foo' AS s1_m1, 'bar' AS s1_m2`)
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'bar']);
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('retrieves all the records at once in the result-set', () => {
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

        context('multiple result-sets', () => {
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

            it('retrieves the first record in the result-set', () => {
                return session.sql(`CALL multi()`)
                    .execute()
                    .then(result => {
                        const first = result.fetchOne();
                        expect(first).to.deep.equal(['foo', 'pending']);

                        expect(result.nextResult()).to.equal(true);
                    });
            });

            it('retrieves each item in the result-sets', () => {
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

            it('retrieves all the items in the result-sets', () => {
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

            it('retrieves an array of result-sets', () => {
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

            it('returns undefined when consuming an item from a result-set that was already entirely consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchOne()).to.deep.equal(['foo', 'pending']);
                        expect(result.fetchOne()).to.deep.equal(['bar', 'pending']);
                        return expect(result.fetchOne()).to.not.exist;
                    });
            });

            it('returns an empty array when consuming a result-set that was already consumed', () => {
                return session.sql('CALL multi()')
                    .execute()
                    .then(result => {
                        expect(result.fetchAll()).to.deep.equal([['foo', 'pending'], ['bar', 'pending']]);
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });

            it('does not implicitely move the cursor to the next result-set when one is consumed', () => {
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

            it('moves the cursor explicitely to the next result-set', () => {
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

            it('keeps the metadata for each result-set being consumed', () => {
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
});
