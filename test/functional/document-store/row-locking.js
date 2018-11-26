'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const pTimeout = require('p-timeout');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional row locking in collection transactions', () => {
    let sessionA, sessionB;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    beforeEach('create two sessions', () => {
        return Promise.all([mysqlx.getSession(config), mysqlx.getSession(config)])
            .then(sessions => {
                sessionA = sessions[0];
                sessionB = sessions[1];
            });
    });

    beforeEach('create collection', () => {
        return sessionA.getSchema(config.schema).createCollection('test');
    });

    beforeEach('add fixtures', () => {
        return sessionA.getSchema(config.schema).getCollection('test')
            .add({ _id: '1', a: 1 })
            .add({ _id: '2', a: 1 })
            .add({ _id: '3', a: 1 })
            .execute();
    });

    afterEach('drop default schema', () => {
        return Promise.all([sessionA.dropSchema(config.schema), sessionB.dropSchema(config.schema)]);
    });

    afterEach('close session', () => {
        return Promise.all([sessionA.close(), sessionB.close()]);
    });

    context('exclusive locks', () => {
        context('default mode', () => {
            it('should allow any session to consistently modify row data', () => {
                const expected = [{ _id: '1', a: 3, b: 'foo' }];
                let samplesA = [];
                let samplesB = [];
                const actual = [];

                const transaction1 = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockExclusive()
                            .execute(doc => samplesA.push(doc));
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
                            .set('a', samplesA[0].a + 1)
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
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockExclusive()
                            .execute(doc => samplesB.push(doc));
                    })
                    .then(() => {
                        return sessionB
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
                            .set('a', samplesB[0].a + 1)
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
                            .getCollection('test')
                            .find('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
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
                const expected = [{ _id: '1', a: 2, b: 'foo' }];
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
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
            const expected = [{ _id: '1', a: 3, b: 'foo' }];
            let samplesA = [];
            let samplesB = [];
            const actual = [];

            const sut = sessionA
                .startTransaction()
                .then(() => {
                    return sessionA
                        .getSchema(config.schema)
                        .getCollection('test')
                        .find('_id = "1"')
                        .lockShared()
                        .execute(doc => samplesA.push(doc));
                })
                .then(() => {
                    return sessionA
                        .getSchema(config.schema)
                        .getCollection('test')
                        .modify('_id = "1"')
                        .set('a', samplesA[0].a + 1)
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
                        .getCollection('test')
                        .find('_id = "1"')
                        .lockShared()
                        .execute(doc => samplesB.push(doc));
                })
                .then(() => {
                    return sessionB
                        .getSchema(config.schema)
                        .getCollection('test')
                        .modify('_id = "1"')
                        .set('a', samplesB[0].a + 1)
                        .set('b', 'foo')
                        .execute();
                })
                .then(() => {
                    return sessionB.commit();
                })
                .then(() => {
                    return sessionA
                        .getSchema(config.schema)
                        .getCollection('test')
                        .find('_id = "1"')
                        .execute(doc => actual.push(doc));
                });

            return expect(sut).to.eventually.be.fulfilled
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });

        context('default mode', () => {
            it('should allow a session to wait until the other session\'s transaction is committed before reading row data', () => {
                const expected = [{ _id: '1', a: 2, b: 'foo' }];
                const actual = [];

                const sut = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
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

            it('should fail if a session tries to modify row data before the other session\'s transaction is committed', () => {
                const deadlock = sessionA
                    .startTransaction()
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionB.startTransaction();
                    })
                    .then(() => {
                        return sessionB
                            .getSchema(config.schema)
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return Promise.all([
                            sessionA
                                .getSchema(config.schema)
                                .getCollection('test')
                                .modify('_id = "1"')
                                .set('a', 2)
                                .execute(),
                            sessionB
                                .getSchema(config.schema)
                                .getCollection('test')
                                .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return sessionA
                            .getSchema(config.schema)
                            .getCollection('test')
                            .modify('_id = "1"')
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
                            .getCollection('test')
                            .find('_id = "1"')
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
            const actual = [];

            const sut = sessionA
                .startTransaction()
                .then(() => {
                    return sessionA
                        .getSchema(config.schema)
                        .getCollection('test')
                        .find('_id = "1"')
                        .execute();
                })
                .then(() => {
                    return sessionA
                        .getSchema(config.schema)
                        .getCollection('test')
                        .modify('_id = "1"')
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
                        .getCollection('test')
                        .find('_id = "1"')
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
