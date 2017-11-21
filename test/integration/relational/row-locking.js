'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const pTimeout = require('p-timeout');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration row locking in table transactions', () => {
    let sessionA, sessionB;

    beforeEach('set context', () => {
        return mysqlx
            .getSession(config)
            .then(session => {
                sessionA = session;
                return sessionA.dropSchema(config.schema).then(() => sessionA);
            })
            .then(session => {
                return session.createSchema(config.schema);
            })
            .then(() => {
                return mysqlx.getSession(config);
            })
            .then(session => {
                sessionB = session;
            });
    });

    beforeEach('create table', function () {
        return sessionA.sql(`CREATE TABLE ${config.schema}.test (
            _id VARCHAR(10) NOT NULL PRIMARY KEY,
            a INT,
            b VARCHAR(10))`).execute()
    });

    beforeEach('add fixtures', () => {
        return sessionA
            .getSchema(config.schema)
            .getTable('test')
            .insert(['_id', 'a', 'b'])
            .values(['1', 1, 'foo'])
            .values(['2', 1, 'bar'])
            .values(['3', 1, 'baz'])
            .execute();
    });

    afterEach('clear context', () => {
        return sessionA
            .dropSchema(config.schema)
            .then(() => {
                return sessionA.close();
            })
            .then(() => {
                return sessionB.dropSchema(config.schema);
            })
            .then(() => {
                return sessionB.close();
            });
    });

    it('should allow to consistently modify row data for sessions with exclusive locks', () => {
        const expected = [ [ '1', 3, 'foo' ] ];
        let samplesA = [];
        let samplesB = [];
        let actual = [];

        const transaction1 = sessionA
            .startTransaction()
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockExclusive()
                    .execute(doc => samplesA.push(doc));
            })
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', samplesA[0][1] + 1)
                    .execute();
            })
            .then(() => {
                return sessionA.commit();
            });

        const transaction2 = sessionB
            .startTransaction()
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockExclusive()
                    .execute(doc => samplesB.push(doc));
            })
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', samplesB[0][1] + 1)
                    .set('b', 'foo')
                    .execute();
            })
            .then(() => {
                return sessionB.commit();
            });

        const sut = Promise
            .all([transaction1, transaction2])
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .execute(doc => actual.push(doc));
            });

        return expect(sut).to.eventually.be.fulfilled
            .then(() => {
                expect(actual).to.deep.equal(expected);
            });
    });

    it('should allow to consistently modify row data for sessions with a shared lock when no other transaction is active', () => {
        const expected = [ [ '1', 3, 'foo' ] ];
        let samplesA = [];
        let samplesB = [];
        let actual = [];

        const sut = sessionA
            .startTransaction()
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute(doc => samplesA.push(doc));
            })
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', samplesA[0][1] + 1)
                    .execute();
            })
            .then(() => {
                return sessionA.commit();
            })
            .then(() => {
                return sessionB.startTransaction();
            })
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute(doc => samplesB.push(doc));
            })
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', samplesB[0][1] + 1)
                    .set('b', 'foo')
                    .execute();
            })
            .then(() => {
                return sessionB.commit();
            })
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .execute(doc => actual.push(doc));
            });

        return expect(sut).to.eventually.be.fulfilled
            .then(() => {
                expect(actual).to.deep.equal(expected);
            });
    });

    it('should allow a session to wait before consistently reading row data when a transaction from a different session with the same shared lock until it is committed', () => {
        const expected = [ [ '1', 2, 'foo' ] ];
        let actual = [];

        const sut = sessionA
            .startTransaction()
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute();
            })
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', 2)
                    .set('b', 'foo')
                    .execute();
            })
            .then(() => {
                return sessionB.startTransaction();
            })
            .then(() => {
                const read = sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute(doc => actual.push(doc));

                return pTimeout(read, 2000);
            })
            .catch(err => {
                // pTimeout error
                if (err.name !== 'TimeoutError') {
                    throw err;
                }

                return sessionA.commit();
            })
            .then(() => {
                return sessionB.commit();
            });

        return expect(sut).to.eventually.be.fulfilled
            .then(() => {
                expect(actual).to.deep.equal(expected);
            });
    });

    it('should prevent a session without any lock from consistently reading row data when a transaction from a different session was not committed', () => {
        const expected = [{ _id: '1', a: 2, b: 'foo' }];
        let actual = [];

        const sut = sessionA
            .startTransaction()
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .execute();
            })
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .update()
                    .where('_id = "1"')
                    .set('a', 2)
                    .set('b', 'foo')
                    .execute();
            })
            .then(() => {
                return sessionB.startTransaction();
            })
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .execute(doc => actual.push(doc));
            })
            .then(() => {
                return sessionA.commit();
            })
            .then(() => {
                return sessionB.commit();
            });

        return expect(sut).to.eventually.be.fulfilled
            .then(() => {
                expect(actual).to.not.deep.equal(expected);
            });
    });

    it('should fail if a session tries to modify row data before a transaction with shared lock from a different session gets committed', () => {
        const deadlock = sessionA
            .startTransaction()
            .then(() => {
                return sessionA
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute();
            })
            .then(() => {
                return sessionB.startTransaction();
            })
            .then(() => {
                return sessionB
                    .getSchema(config.schema)
                    .getTable('test')
                    .select()
                    .where('_id = "1"')
                    .lockShared()
                    .execute();
            })
            .then(() => {
                return Promise.all([
                    sessionA
                        .getSchema(config.schema)
                        .getTable('test')
                        .update()
                        .where('_id = "1"')
                        .set('a', 2)
                        .execute(),
                    sessionB
                        .getSchema(config.schema)
                        .getTable('test')
                        .update()
                        .where('_id = "1"')
                        .set('a', 3)
                        .set('b', 'foo')
                        .execute()
                ]);
            });

        return expect(deadlock).to.eventually.be.rejected
            .then(err => {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(1213);

                return Promise.all([sessionA.commit(), sessionB.commit()]);
            });
    });
});
