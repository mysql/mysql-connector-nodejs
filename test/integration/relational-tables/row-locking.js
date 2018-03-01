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

    beforeEach('create two sessions', () => {
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
            _id VARCHAR(10),
            a INT,
            b VARCHAR(10))`).execute();
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

    context('exclusive locks', () => {
        context('default mode', () => {
            it('should allow any session to consistently update row data', () => {
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
        });

        context('NOWAIT mode', () => {
            it('should fail if a session tries to read row data before the other session\'s transaction is committed', () => {
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .select('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .update('_id = "1"')
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
                            .select('_id = "1"')
                            .lockExclusive(mysqlx.LockContention.NOWAIT)
                            .execute(doc => actual.push(doc));
                    });

                return expect(sut).to.eventually.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(3572);

                        return Promise.all([sessionA.commit(), sessionB.commit()]);
                    });
            });
        });

        context('SKIP LOCKED mode', () => {
            it('should allow a session to read inconsistent row data before the other session\'s transaction is committed', () => {
                const expected = [ [ '1', 2, 'foo' ] ];
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .select('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .update('_id = "1"')
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
                            .select('_id = "1"')
                            .lockExclusive(mysqlx.LockContention.SKIP_LOCKED)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => {
                        return sessionB.commit();
                    })
                    .then(() => {
                        return sessionA.commit();
                    });

                return expect(sut).to.eventually.be.fulfilled
                    .then(() => {
                        expect(actual).to.not.deep.equal(expected);
                    });
            });
        });
    });

    context('shared locks', () => {
        it('should allow any session to consistently update row data when no other transaction is active', () => {
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

        context('default mode', () => {
            it('should allow a session to wait until the other session\'s transaction is committed before reading row data', () => {
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

            it('should fail if a session tries to update row data before the other session\'s transaction is committed', () => {
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

        context('NOWAIT mode', () => {
            it('should fail if a session tries to read row data before the other session\'s transaction is committed', () => {
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .select('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .update('_id = "1"')
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
                            .select('_id = "1"')
                            .lockShared(mysqlx.LockContention.NOWAIT)
                            .execute(doc => actual.push(doc));
                    });

                return expect(sut).to.eventually.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(3572);

                        return Promise.all([sessionA.commit(), sessionB.commit()]);
                    });
            });
        });

        context('SKIP LOCKED mode', () => {
            it('should allow a session to read inconsistent row data before the other session\'s transaction is committed', () => {
                const expected = [{ _id: '1', a: 2, b: 'foo' }];
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .select('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getTable('test')
                            .update('_id = "1"')
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
                            .select('_id = "1"')
                            .lockShared(mysqlx.LockContention.SKIP_LOCKED)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => {
                        return sessionB.commit();
                    })
                    .then(() => {
                        return sessionA.commit();
                    });

                return expect(sut).to.eventually.be.fulfilled
                    .then(() => {
                        expect(actual).to.not.deep.equal(expected);
                    });
            });
        });
    });

    context('no locks', () => {
        it('should prevent a session from reading row data until the other session\'s transaction is committed', () => {
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
    });
});
