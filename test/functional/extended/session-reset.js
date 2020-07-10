'use strict';

/* eslint-env node, mocha */

const config = require('../../config');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');
const path = require('path');

describe('session reset behavior with older servers', () => {
    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', schema: undefined, socket: undefined };

    context('closing legacy sessions', () => {
        let session;

        beforeEach('create legacy session', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(resetConfig)
                .then(s => { session = s; });
        });

        afterEach('destroy legacy session', () => {
            return session.close();
        });

        it('new connections are assigned new ids', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            let beforeClose, afterClose;

            return session.sql('SELECT CONNECTION_ID()')
                .execute(row => { beforeClose = row[0]; })
                .then(() => session.close())
                .then(() => mysqlx.getSession(resetConfig))
                .then(s => {
                    session = s;
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => { afterClose = row[0]; });
                })
                .then(() => expect(beforeClose).to.not.equal(afterClose));
        });
    });

    context('re-using idle connections from a pool', () => {
        let client;

        beforeEach('create pool', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            client = mysqlx.getClient(resetConfig, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('new connections are assigned new ids', () => {
            let beforeReset, afterReset;

            return client.getSession()
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => { beforeReset = row[0]; })
                        .then(() => session.close())
                        .then(() => client.getSession())
                        .then(session => {
                            return session.sql('SELECT CONNECTION_ID()')
                                .execute(row => { afterReset = row[0]; });
                        })
                        .then(() => expect(afterReset).to.not.equal(beforeReset));
                });
        });
    });

    context('reaching the maximum number of connections supported by the server', () => {
        let client;

        beforeEach('create pool', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            client = mysqlx.getClient(resetConfig, { pooling: { maxSize: 1 } });
        });

        beforeEach('update mysqlx_max_connections', () => {
            return fixtures.setServerGlobalVariable('mysqlx_max_connections', 1, baseConfig);
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        afterEach('reset mysqlx_max_connections', () => {
            return fixtures.setServerGlobalVariable('mysqlx_max_connections', 100, baseConfig);
        });

        it('BUG#29436892 does not fail when re-creating an idle connection', () => {
            return client.getSession()
                .then(session => session.close())
                .then(() => client.getSession());
        });
    });

    context('when debug mode is enabled', () => {
        // socket must be null in order to be correctly parsed after JSON.stringify()
        const resetConfig = Object.assign({}, config, baseConfig, { socket: null });

        context('with a standalone connection', () => {
            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script, [JSON.stringify(resetConfig)])
                    .then(proc => {
                        return expect(proc.logs).to.be.an('array').and.be.empty;
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script, [JSON.stringify(resetConfig)])
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.false;
                    });
            });
        });

        context('with a connection pool', () => {
            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script, [JSON.stringify(resetConfig)])
                    .then(proc => {
                        return expect(proc.logs).to.be.an('array').and.be.empty;
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script, [JSON.stringify(resetConfig)])
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.false;
                    });
            });
        });
    });
});
