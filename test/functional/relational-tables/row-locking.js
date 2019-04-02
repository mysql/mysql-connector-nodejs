'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const util = require('../../util');

describe('row locking in table transactions', () => {
    let sessionA, sessionB, tableFromA, tableFromB;

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

    beforeEach('create table', function () {
        return sessionA.sql(`CREATE TABLE test (_id VARCHAR(10), a INT, b VARCHAR(10))`)
            .execute();
    });

    beforeEach('assign collection instances', () => {
        tableFromA = sessionA.getSchema(config.schema).getTable('test');
        tableFromB = sessionB.getSchema(config.schema).getTable('test');
    });

    beforeEach('add fixtures', () => {
        return tableFromA.insert(['_id', 'a', 'b'])
            .values(['1', 1, 'foo'])
            .values(['2', 1, 'bar'])
            .values(['3', 1, 'baz'])
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
            it('allows any session to consistently update row data', () => {
                const expected = [ [ '1', 3, 'foo' ] ];
                const actual = [];

                let samplesA = [];
                let samplesB = [];

                const transaction1 = sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select()
                            .where('_id = "1"')
                            .lockExclusive()
                            .execute(doc => samplesA.push(doc));
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', samplesA[0][1] + 1)
                            .execute();
                    })
                    .then(() => sessionA.commit());

                const transaction2 = sessionB.startTransaction()
                    .then(() => {
                        return tableFromB.select()
                            .where('_id = "1"')
                            .lockExclusive()
                            .execute(doc => samplesB.push(doc));
                    })
                    .then(() => {
                        return tableFromB.update()
                            .where('_id = "1"')
                            .set('a', samplesB[0][1] + 1)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.commit());

                return Promise.all([transaction1, transaction2])
                    .then(() => {
                        return tableFromA.select()
                            .where('_id = "1"')
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                    });
            });
        });

        context('NOWAIT mode', () => {
            it('fails if a session tries to read row data before the other session\'s transaction is committed', () => {
                const actual = [];

                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', 2)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        return tableFromB.select('_id = "1"')
                            .lockExclusive(mysqlx.LockContention.NOWAIT)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(3572);

                        return Promise.all([sessionA.commit(), sessionB.commit()]);
                    });
            });
        });

        context('SKIP LOCKED mode', () => {
            it('allows a session to read inconsistent row data before the other session\'s transaction is committed', () => {
                const expected = [ [ '1', 2, 'foo' ] ];
                const actual = [];

                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select('_id = "1"')
                            .lockExclusive()
                            .execute();
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', 2)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        return tableFromB.select('_id = "1"')
                            .lockExclusive(mysqlx.LockContention.SKIP_LOCKED)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => sessionB.commit())
                    .then(() => sessionA.commit())
                    .then(() => {
                        expect(actual).to.not.deep.equal(expected);
                    });
            });
        });
    });

    context('shared locks', () => {
        it('allows any session to consistently update row data when no other transaction is active', () => {
            const expected = [ [ '1', 3, 'foo' ] ];
            const actual = [];

            let samplesA = [];
            let samplesB = [];

            return sessionA.startTransaction()
                .then(() => {
                    return tableFromA.select()
                        .where('_id = "1"')
                        .lockShared()
                        .execute(doc => samplesA.push(doc));
                })
                .then(() => {
                    return tableFromA.update()
                        .where('_id = "1"')
                        .set('a', samplesA[0][1] + 1)
                        .execute();
                })
                .then(() => sessionA.commit())
                .then(() => sessionB.startTransaction())
                .then(() => {
                    return tableFromB.select()
                        .where('_id = "1"')
                        .lockShared()
                        .execute(doc => samplesB.push(doc));
                })
                .then(() => {
                    return tableFromB.update()
                        .where('_id = "1"')
                        .set('a', samplesB[0][1] + 1)
                        .set('b', 'foo')
                        .execute();
                })
                .then(() => sessionB.commit())
                .then(() => {
                    return tableFromA.select()
                        .where('_id = "1"')
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });

        context('default mode', () => {
            it('allows a session to wait until the other session\'s transaction is committed before reading row data', () => {
                const expected = [ [ '1', 2, 'foo' ] ];
                const actual = [];

                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select()
                            .where('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', 2)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        const read = tableFromB.select()
                            .where('_id = "1"')
                            .lockShared()
                            .execute(doc => actual.push(doc));

                        return util.timeout(read, 2000);
                    })
                    .catch(err => {
                        // pTimeout error
                        if (err.name !== 'TimeoutError') {
                            throw err;
                        }

                        return sessionA.commit();
                    })
                    .then(() => sessionB.commit())
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                    });
            });

            it('fails if a session tries to update row data before the other session\'s transaction is committed', () => {
                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select()
                            .where('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        return tableFromB.select()
                            .where('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return Promise.all([
                            tableFromA.update().where('_id = "1"').set('a', 2).execute(),
                            tableFromB.update().where('_id = "1"').set('a', 3).set('b', 'foo').execute()
                        ]);
                    })
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1213);

                        return Promise.all([sessionA.commit(), sessionB.commit()]);
                    });
            });
        });

        context('NOWAIT mode', () => {
            it('fails if a session tries to read row data before the other session\'s transaction is committed', () => {
                const actual = [];

                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', 2)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        return tableFromB.select('_id = "1"')
                            .lockShared(mysqlx.LockContention.NOWAIT)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(3572);

                        return Promise.all([sessionA.commit(), sessionB.commit()]);
                    });
            });
        });

        context('SKIP LOCKED mode', () => {
            it('allows a session to read inconsistent row data before the other session\'s transaction is committed', () => {
                const expected = [{ _id: '1', a: 2, b: 'foo' }];
                const actual = [];

                return sessionA.startTransaction()
                    .then(() => {
                        return tableFromA.select('_id = "1"')
                            .lockShared()
                            .execute();
                    })
                    .then(() => {
                        return tableFromA.update()
                            .where('_id = "1"')
                            .set('a', 2)
                            .set('b', 'foo')
                            .execute();
                    })
                    .then(() => sessionB.startTransaction())
                    .then(() => {
                        return tableFromB.select('_id = "1"')
                            .lockShared(mysqlx.LockContention.SKIP_LOCKED)
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => sessionB.commit())
                    .then(() => sessionA.commit())
                    .then(() => {
                        expect(actual).to.not.deep.equal(expected);
                    });
            });
        });
    });

    context('no locks', () => {
        it('prevents a session from reading row data until the other session\'s transaction is committed', () => {
            const expected = [{ _id: '1', a: 2, b: 'foo' }];
            const actual = [];

            return sessionA.startTransaction()
                .then(() => {
                    return tableFromA.select()
                        .where('_id = "1"')
                        .execute();
                })
                .then(() => {
                    return tableFromA.update()
                        .where('_id = "1"')
                        .set('a', 2)
                        .set('b', 'foo')
                        .execute();
                })
                .then(() => sessionB.startTransaction())
                .then(() => {
                    return tableFromB.select()
                        .where('_id = "1"')
                        .execute(doc => actual.push(doc));
                })
                .then(() => sessionA.commit())
                .then(() => sessionB.commit())
                .then(() => {
                    expect(actual).to.not.deep.equal(expected);
                });
        });
    });
});
