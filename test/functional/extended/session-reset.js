'use strict';

/* eslint-env node, mocha */

const config = require('../../config');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

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
});
