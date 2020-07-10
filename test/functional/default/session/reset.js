'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');

describe('session reset behavior', () => {
    const baseConfig = { schema: undefined };

    context('when using standalone sessions', () => {
        it('new connections are assigned new ids', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            let firstConnectionId, secondConnectionId;

            return mysqlx.getSession(resetConfig)
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return mysqlx.getSession(resetConfig);
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.not.equal(secondConnectionId);
                });
        });
    });

    context('when using a connection pool', () => {
        let client;

        beforeEach('create pool', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            client = mysqlx.getClient(resetConfig, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('idle connections are not assigned a new id', () => {
            let firstConnectionId, secondConnectionId;

            return client.getSession()
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return client.getSession();
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.equal(secondConnectionId);
                });
        });
    });

    context('when debug mode is enabled', () => {
        context('with a standalone connection', () => {
            it('logs the expectation pipeline opening', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Open', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('op', 'cond');
                        expect(proc.logs[0].op).to.equal('EXPECT_CTX_COPY_PREV');
                        expect(proc.logs[0].cond).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0].cond[0]).to.have.keys('condition_key', 'condition_value', 'op');
                        expect(proc.logs[0].cond[0].condition_key).to.equal('EXPECT_FIELD_EXIST');
                        expect(proc.logs[0].cond[0].condition_value).to.have.keys('type', 'data');
                        // eslint-disable-next-line node/no-deprecated-api
                        expect((new Buffer(proc.logs[0].cond[0].condition_value.data)).toString()).to.equal('6.1'); // keep_open
                        expect(proc.logs[0].cond[0].op).to.equal('EXPECT_OP_SET');
                    });
            });

            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.true;
                    });
            });
        });

        context('with a connection pool', () => {
            it('logs the expectation pipeline opening', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Open', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('op', 'cond');
                        expect(proc.logs[0].op).to.equal('EXPECT_CTX_COPY_PREV');
                        expect(proc.logs[0].cond).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0].cond[0]).to.have.keys('condition_key', 'condition_value', 'op');
                        expect(proc.logs[0].cond[0].condition_key).to.equal('EXPECT_FIELD_EXIST');
                        expect(proc.logs[0].cond[0].condition_value).to.have.keys('type', 'data');
                        // eslint-disable-next-line node/no-deprecated-api
                        expect((new Buffer(proc.logs[0].cond[0].condition_value.data)).toString()).to.equal('6.1'); // keep_open
                        expect(proc.logs[0].cond[0].op).to.equal('EXPECT_OP_SET');
                    });
            });

            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.true;
                    });
            });
        });
    });
});
